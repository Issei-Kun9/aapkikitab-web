/* Orders and Razorpay payments. Prices always come from the database, never from the browser. */
import { db, HttpError, hmacHex, now, parseJson, randomId, safeEqual, type Env } from "./core";
import { getById, getEntry, type Entry } from "./entries";
import { adminEmails } from "./auth";
import { newOrderAlert, orderPlacedEmail, sendQuietly, type OrderForMail } from "./email";

export interface OrderItem {
  id: string;
  handle: string;
  title: string;
  price: number;
  qty: number;
  image: string;
}
export interface OrderAddress {
  line: string;
  city: string;
  state: string;
  pincode: string;
}
export interface Order {
  id: string;
  number: number;
  customer_id: string | null;
  email: string;
  name: string;
  phone: string;
  address: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded" | "partially_refunded" | "failed";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  refunded: number;
  courier: string;
  tracking_number: string;
  tracking_url: string;
  note: string;
  history: { at: string; text: string }[];
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

type Row = Omit<Order, "address" | "items" | "history"> & { address: string; items: string; history: string };
const toOrder = (r: Row): Order => ({ ...r, address: parseJson(r.address, { line: "", city: "", state: "", pincode: "" }), items: parseJson(r.items, []), history: parseJson(r.history, []) });

export const mailView = (o: Order): OrderForMail => o;

export async function getOrder(env: Env, id: string): Promise<Order | null> {
  const r = await db(env).prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<Row>();
  return r ? toOrder(r) : null;
}

export async function listOrders(env: Env, opts: { status?: string; email?: string; q?: string; limit?: number; offset?: number } = {}) {
  const where: string[] = ["status != 'pending'"];
  const args: unknown[] = [];
  if (opts.status === "pending") where[0] = "status = 'pending'";
  else if (opts.status) {
    where.push("status = ?");
    args.push(opts.status);
  }
  if (opts.email) {
    where.push("email = ?");
    args.push(opts.email.toLowerCase());
  }
  if (opts.q) {
    where.push("(CAST(number AS TEXT) = ? OR name LIKE ? OR phone LIKE ? OR email LIKE ?)");
    const like = `%${opts.q}%`;
    args.push(opts.q.replace(/^#/, ""), like, like, like);
  }
  const r = await db(env)
    .prepare(`SELECT * FROM orders WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...args, opts.limit ?? 50, opts.offset ?? 0)
    .all<Row>();
  return r.results.map(toOrder);
}

export async function addHistory(env: Env, id: string, text: string, extra: Partial<Record<keyof Row, unknown>> = {}) {
  const o = await getOrder(env, id);
  if (!o) throw new HttpError(404, "Order not found.");
  const history = [...o.history, { at: now(), text }].slice(-100);
  const sets = Object.keys(extra).map((k) => `${k.replace(/[^a-z_]/g, "")} = ?`);
  await db(env)
    .prepare(`UPDATE orders SET history = ?, updated_at = ?${sets.length ? ", " + sets.join(", ") : ""} WHERE id = ?`)
    .bind(JSON.stringify(history), now(), ...Object.values(extra), id)
    .run();
  return (await getOrder(env, id))!;
}

/* ---- shop rules ---- */
async function shopRules(env: Env) {
  const info = await getEntry(env, "ak_shop_info", "shop-details");
  const d = info?.data ?? {};
  const freeAbove = Number(d.free_shipping_above ?? 0) || 0;
  const fee = Number(d.shipping_fee ?? 0) || 0;
  return { freeAbove, fee, cod: d.cod_available === true, contactEmail: String(d.contact_email ?? "") };
}
const shippingFor = (subtotal: number, r: { freeAbove: number; fee: number }) => (r.fee === 0 || subtotal >= r.freeAbove ? 0 : r.fee);

export async function teamEmails(env: Env) {
  const r = await shopRules(env);
  return [...new Set([r.contactEmail, ...adminEmails(env)].filter(Boolean).map((e) => e.toLowerCase()))];
}

/* ---- creating an order from the cart ---- */
export async function priceCart(env: Env, lines: { handle: string; qty: number }[]) {
  if (!lines.length) throw new HttpError(400, "Your cart is empty.");
  if (lines.length > 50) throw new HttpError(400, "Too many items in one order.");
  const items: OrderItem[] = [];
  for (const l of lines) {
    const qty = Math.max(1, Math.min(20, Math.round(Number(l.qty) || 1)));
    const p: Entry | null = await getEntry(env, "product", String(l.handle));
    if (!p || p.status !== "active") throw new HttpError(409, "Some items in your cart are no longer available. Please remove them and try again.");
    const stock = p.data.stock;
    if (typeof stock === "number" && stock < qty) throw new HttpError(409, stock <= 0 ? `“${p.data.title}” is sold out.` : `Only ${stock} of “${p.data.title}” left. Please lower the quantity.`);
    const images = (p.data.images as string[] | undefined) ?? [];
    items.push({ id: p.id, handle: p.handle, title: String(p.data.title ?? p.handle), price: Number(p.data.price), qty, image: images[0] ? `/media/${images[0]}` : "" });
  }
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const shipping = shippingFor(subtotal, await shopRules(env));
  return { items, subtotal, shipping, total: subtotal + shipping };
}

export async function createOrder(
  env: Env,
  input: { lines: { handle: string; qty: number }[]; name: string; phone: string; email: string; address: OrderAddress; customerId: string | null },
) {
  const priced = await priceCart(env, input.lines);
  const id = randomId();
  const next = await db(env).prepare("UPDATE counters SET value = value + 1 WHERE name = 'order_number' RETURNING value").first<{ value: number }>();
  const number = next?.value ?? Date.now() % 100000;
  const rzp = await razorpayOrder(env, priced.total * 100, `AK${number}`, { order_id: id });
  await db(env)
    .prepare(
      `INSERT INTO orders (id, number, customer_id, email, name, phone, address, items, subtotal, shipping, total, razorpay_order_id, history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id, number, input.customerId, input.email.toLowerCase(), input.name, input.phone, JSON.stringify(input.address),
      JSON.stringify(priced.items), priced.subtotal, priced.shipping, priced.total, rzp.id, JSON.stringify([{ at: now(), text: "Checkout started" }]),
    )
    .run();
  return { id, number, ...priced, razorpayOrderId: rzp.id };
}

/* Called from the browser after payment and from Razorpay's webhook. Safe to call twice. */
export async function markPaid(env: Env, razorpayOrderId: string, paymentId: string, waitUntil?: (p: Promise<unknown>) => void) {
  const r = await db(env).prepare("SELECT * FROM orders WHERE razorpay_order_id = ?").bind(razorpayOrderId).first<Row>();
  if (!r) throw new HttpError(404, "Order not found.");
  const o = toOrder(r);
  if (o.payment_status !== "unpaid" && o.payment_status !== "failed") return o;
  // claim the order atomically so a double confirmation (browser + webhook) only counts once
  const claim = await db(env)
    .prepare("UPDATE orders SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'paid' ELSE status END, razorpay_payment_id = ?, paid_at = ? WHERE id = ? AND payment_status IN ('unpaid','failed')")
    .bind(paymentId, now(), o.id)
    .run();
  if (!claim.meta.changes) return (await getOrder(env, o.id))!;
  const paid = await addHistory(env, o.id, `Paid ₹${o.total} by Razorpay (${paymentId})`);
  // stock goes down only once the money is in
  for (const i of o.items) {
    await db(env)
      .prepare("UPDATE entries SET data = json_set(data, '$.stock', MAX(0, json_extract(data, '$.stock') - ?)) WHERE id = ? AND json_type(data, '$.stock') = 'integer'")
      .bind(i.qty, i.id)
      .run();
  }
  const mails = async () => {
    if (paid.email) await sendQuietly(env, { to: paid.email, ...orderPlacedEmail(env, mailView(paid)) });
    const team = await teamEmails(env);
    if (team.length) await sendQuietly(env, { to: team, ...newOrderAlert(env, mailView(paid)) });
  };
  if (waitUntil) waitUntil(mails());
  else await mails();
  return paid;
}

/* ---- Razorpay ---- */
const devPayments = (env: Env) => env.DEV_MODE === "1" && !env.RAZORPAY_KEY_SECRET;

function rzpAuth(env: Env) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new HttpError(503, "Online payment is not set up yet. Please try again soon or contact us.");
  return `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`;
}

async function rzp<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { authorization: rzpAuth(env), "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const j = (await r.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!r.ok) throw new HttpError(502, j.error?.description || "Payment service error. Please try again.");
  return j;
}

async function razorpayOrder(env: Env, amountPaise: number, receipt: string, notes: Record<string, string>) {
  if (devPayments(env)) return { id: `order_dev_${randomId(10)}` };
  return rzp<{ id: string }>(env, "/orders", { method: "POST", body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }) });
}

export async function verifyCheckoutSignature(env: Env, orderId: string, paymentId: string, signature: string) {
  if (devPayments(env)) return signature === "dev_signature";
  if (!env.RAZORPAY_KEY_SECRET) return false;
  return safeEqual(await hmacHex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);
}

export async function verifyWebhook(env: Env, rawBody: string, signature: string) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  return safeEqual(await hmacHex(env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
}

export async function refundPayment(env: Env, o: Order, amountRupees: number) {
  if (!o.razorpay_payment_id) throw new HttpError(400, "This order has no payment to refund.");
  const left = o.total - o.refunded;
  const amount = Math.round(amountRupees);
  if (amount < 1 || amount > left) throw new HttpError(400, `You can refund between ₹1 and ₹${left}.`);
  if (!devPayments(env)) {
    await rzp(env, `/payments/${o.razorpay_payment_id}/refund`, { method: "POST", body: JSON.stringify({ amount: amount * 100, speed: "normal" }) });
  }
  const refunded = o.refunded + amount;
  return addHistory(env, o.id, `Refunded ₹${amount} to the customer`, {
    refunded,
    payment_status: refunded >= o.total ? "refunded" : "partially_refunded",
  });
}

export const razorpayKeyId = (env: Env) => (devPayments(env) ? "rzp_dev" : env.RAZORPAY_KEY_ID ?? "");

/* Orders for one customer: by account or by the email used at checkout */
export async function ordersFor(env: Env, customerId: string, email: string) {
  const r = await db(env)
    .prepare("SELECT * FROM orders WHERE (customer_id = ? OR email = ?) AND status != 'pending' ORDER BY created_at DESC LIMIT 50")
    .bind(customerId, email.toLowerCase())
    .all<Row>();
  return r.results.map(toOrder);
}

export async function hasPaidOrder(env: Env, customerId: string, email: string) {
  const r = await db(env)
    .prepare("SELECT 1 AS x FROM orders WHERE (customer_id = ? OR email = ?) AND payment_status IN ('paid','partially_refunded') LIMIT 1")
    .bind(customerId, email.toLowerCase())
    .first();
  return Boolean(r);
}

export const customerOrderView = (o: Order) => ({
  id: o.id,
  number: o.number,
  created_at: o.created_at,
  status: o.status,
  payment_status: o.payment_status,
  items: o.items,
  subtotal: o.subtotal,
  shipping: o.shipping,
  total: o.total,
  refunded: o.refunded,
  courier: o.courier,
  tracking_number: o.tracking_number,
  tracking_url: o.tracking_url,
  name: o.name,
  phone: o.phone,
  address: o.address,
});

export { getById };
