/* POST /api/checkout { lines: [{handle, qty}], name, phone, email, address: {line, city, state, pincode} }
   → creates the order and a Razorpay payment for it; the browser then opens Razorpay. */
import { body, clean, handle, HttpError, isEmail, json, sameSite } from "../../../server/core";
import { currentCustomer } from "../../../server/auth";
import { createOrder, razorpayKeyId } from "../../../server/orders";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  const b = await body(request);
  const a = (b.address ?? {}) as Record<string, unknown>;
  const name = clean(b.name, 80);
  const phone = clean(b.phone, 15).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const customer = await currentCustomer(env, request);
  const email = (clean(b.email, 200) || customer?.email || "").toLowerCase();
  const address = { line: clean(a.line, 300), city: clean(a.city, 80), state: clean(a.state, 80), pincode: clean(a.pincode, 6) };
  if (!name) throw new HttpError(400, "Please enter your full name.");
  if (!/^[6-9]\d{9}$/.test(phone)) throw new HttpError(400, "Please enter a valid 10-digit mobile number.");
  if (email && !isEmail(email)) throw new HttpError(400, "Please enter a valid email, or leave it empty.");
  if (!address.line || !address.city || !address.state) throw new HttpError(400, "Please fill in your full address.");
  if (!/^\d{6}$/.test(address.pincode)) throw new HttpError(400, "Please enter a valid 6-digit pincode.");
  const lines = (Array.isArray(b.lines) ? b.lines : []).map((l: { handle?: unknown; qty?: unknown }) => ({ handle: clean(l?.handle, 120), qty: Number(l?.qty) || 1 })).filter((l) => l.handle);
  const o = await createOrder(env, { lines, name, phone, email, address, customerId: customer?.id ?? null });
  return json({
    orderId: o.id,
    number: o.number,
    total: o.total,
    razorpay: { key: razorpayKeyId(env), order_id: o.razorpayOrderId, amount: o.total * 100, currency: "INR", prefill: { name, email, contact: `+91${phone}` } },
  });
});
