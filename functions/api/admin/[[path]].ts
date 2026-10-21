/* Admin panel API: /api/admin/<route>. Everything except signing in needs an admin session. */
import { body, clean, db, handle, HttpError, json, now, safeEqual, sameSite, sha256, type Ctx } from "../../../server/core";
import { adminEmails, checkCode, endSession, requireAdmin, sendCode, startSession } from "../../../server/auth";
import { countByStatus, createEntry, deleteEntry, getById, listEntries, requireType, updateEntry, validate } from "../../../server/entries";
import { mediaUrl, saveMedia } from "../../../server/media";
import { addHistory, getOrder, listOrders, mailView, refundPayment, type Order } from "../../../server/orders";
import { chatLog, type ChatMsg } from "../../../server/community";
import { cancelledEmail, deliveredEmail, refundEmail, sendEmail, sendQuietly, shippedEmail } from "../../../server/email";
import { TYPES } from "../../../shared/content-types";

type Handler = (ctx: Ctx & { who: string; url: URL }) => Promise<Response>;
const routes: Record<string, Handler> = {};
const open = new Set(["POST login/code", "POST login/verify", "POST login/password", "GET me"]);
const route = (key: string, h: Handler) => (routes[key] = h);

/* ---- signing in ---- */
route("POST login/code", async ({ request, env }) => json(await sendCode(env, clean((await body(request)).email, 200), "admin")));

route("POST login/verify", async ({ request, env }) => {
  const b = await body(request);
  const email = await checkCode(env, clean(b.email, 200), clean(b.code, 10), "admin");
  return json({ ok: true, who: email }, 200, { "set-cookie": await startSession(env, "admin", email, 14) });
});

route("POST login/password", async ({ request, env }) => {
  if (!env.ADMIN_PASSWORD) throw new HttpError(400, "Password sign-in is not switched on. Use the email code instead.");
  const since = Date.now() - 30 * 60_000;
  const fails = await db(env).prepare("SELECT COUNT(*) AS n FROM login_codes WHERE email = 'password-fail' AND created_at > ?").bind(since).first<{ n: number }>();
  if ((fails?.n ?? 0) >= 10) throw new HttpError(429, "Too many wrong tries. Please wait 30 minutes or use the email code.");
  const given = clean((await body(request)).password, 200);
  if (!safeEqual(await sha256(given), await sha256(env.ADMIN_PASSWORD))) {
    await db(env).prepare("INSERT INTO login_codes (email, code_hash, purpose, expires_at, created_at) VALUES ('password-fail', '', 'admin', ?, ?)").bind(Date.now() + 3600_000, Date.now()).run();
    throw new HttpError(400, "That password is not right.");
  }
  return json({ ok: true, who: "owner" }, 200, { "set-cookie": await startSession(env, "admin", "owner", 14) });
});

route("POST logout", async ({ request, env }) => json({ ok: true }, 200, { "set-cookie": await endSession(env, request, "admin") }));

route("GET me", async ({ request, env }) => {
  let who: string | null = null;
  try {
    who = await requireAdmin(env, request);
  } catch {
    who = null;
  }
  return json({
    who,
    setup: {
      database: Boolean(env.DB),
      storage: Boolean(env.MEDIA),
      email: Boolean(env.RESEND_API_KEY),
      payments: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
      webhook: Boolean(env.RAZORPAY_WEBHOOK_SECRET),
      password: Boolean(env.ADMIN_PASSWORD),
      emailLogin: adminEmails(env).length > 0,
      publishNow: Boolean(env.GITHUB_DISPATCH_TOKEN),
      dev: env.DEV_MODE === "1",
    },
  });
});

/* ---- home screen ---- */
route("GET dashboard", async ({ env }) => {
  const one = async (sql: string, ...args: unknown[]) => (await db(env).prepare(sql).bind(...args).first<{ n: number }>())?.n ?? 0;
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const [toPack, toShip, todayOrders, todaySales, pendingReviews, pendingComments, newChats, newMessages, lowStock] = await Promise.all([
    one("SELECT COUNT(*) AS n FROM orders WHERE status = 'paid'"),
    one("SELECT COUNT(*) AS n FROM orders WHERE status = 'packed'"),
    one("SELECT COUNT(*) AS n FROM orders WHERE payment_status != 'unpaid' AND substr(datetime(paid_at, '+330 minutes'), 1, 10) = ?", today),
    one("SELECT COALESCE(SUM(total - refunded), 0) AS n FROM orders WHERE payment_status != 'unpaid' AND substr(datetime(paid_at, '+330 minutes'), 1, 10) = ?", today),
    one("SELECT COUNT(*) AS n FROM entries WHERE type = 'ak_post' AND status = 'draft'"),
    one("SELECT COUNT(*) AS n FROM entries WHERE type = 'ak_comment' AND status = 'draft'"),
    one("SELECT COUNT(*) AS n FROM entries WHERE type = 'ak_chat' AND json_extract(data, '$.status') = 'New message'"),
    one("SELECT COUNT(*) AS n FROM entries WHERE type = 'ak_message' AND json_extract(data, '$.status') = 'New'"),
    one("SELECT COUNT(*) AS n FROM entries WHERE type = 'product' AND status = 'active' AND json_type(data, '$.stock') = 'integer' AND json_extract(data, '$.stock') <= 2"),
  ]);
  return json({ toPack, toShip, todayOrders, todaySales, pendingReviews, pendingComments, newChats, newMessages, lowStock });
});

/* ---- content (products, homepage, menus, reviews, chats, policies …) ---- */
route("GET counts", async ({ env }) => {
  const out: Record<string, Record<string, number>> = {};
  for (const t of TYPES) out[t.type] = await countByStatus(env, t.type);
  return json(out);
});

route("GET entries", async ({ env, url }) => {
  const type = clean(url.searchParams.get("type"), 40);
  requireType(type);
  const status = url.searchParams.get("status");
  const order = url.searchParams.get("order") === "recent" ? "recent" : "position";
  const list = await listEntries(env, type, { status: status === "active" || status === "draft" ? status : undefined, order, limit: 1000 });
  return json({ entries: list });
});

route("GET entry", async ({ env, url }) => {
  const e = await getById(env, clean(url.searchParams.get("id"), 40));
  if (!e) throw new HttpError(404, "Not found.");
  return json({ entry: e });
});

route("POST entry", async ({ request, env }) => {
  const b = await body(request);
  const t = requireType(clean(b.type, 40));
  if (t.single && (await listEntries(env, t.type, { limit: 1 })).length) throw new HttpError(400, `There is only one “${t.name}”. Please edit it instead.`);
  const data = validate(t, (b.data ?? {}) as Record<string, unknown>);
  const status = b.status === "active" ? "active" : b.status === "draft" ? "draft" : t.publishable ? "draft" : "active";
  return json({ entry: await createEntry(env, t.type, data, { status, handle: clean(b.handle, 80) || undefined }) });
});

route("PUT entry", async ({ request, env }) => {
  const b = await body(request);
  const e = await getById(env, clean(b.id, 40));
  if (!e) throw new HttpError(404, "Not found.");
  const t = requireType(e.type);
  // hidden fields (e.g. a chat's messages) are kept as they are
  const hidden = Object.fromEntries(t.fields.filter((f) => f.hidden || f.readonly).map((f) => [f.key, e.data[f.key]]).filter(([, v]) => v !== undefined));
  const input = Object.fromEntries(Object.entries((b.data ?? {}) as Record<string, unknown>).filter(([k]) => !(k in hidden)));
  const data = b.data ? { ...Object.fromEntries(t.fields.map((f) => [f.key, undefined])), ...validate(t, input, { keepHidden: hidden }) } : undefined;
  const status = b.status === "active" || b.status === "draft" ? b.status : undefined;
  const position = typeof b.position === "number" ? Math.round(b.position) : undefined;
  // a team reply on a review gets its date the first time it is written
  if (data && e.type === "ak_post" && data.team_reply && !e.data.reply_at) data.reply_at = now();
  return json({ entry: await updateEntry(env, e.id, { data, status, position, handle: clean(b.handle, 80) || undefined }) });
});

route("DELETE entry", async ({ env, url }) => {
  const e = await getById(env, clean(url.searchParams.get("id"), 40));
  if (!e) throw new HttpError(404, "Not found.");
  if (requireType(e.type).single) throw new HttpError(400, "This one can't be deleted — edit it instead.");
  await deleteEntry(env, e.id);
  if (e.type === "ak_post") await db(env).prepare("DELETE FROM entries WHERE type = 'ak_comment' AND json_extract(data, '$.post') = ?").bind(e.id).run();
  return json({ ok: true });
});

route("POST reorder", async ({ request, env }) => {
  const b = await body(request);
  const ids = (Array.isArray(b.ids) ? b.ids : []).map((x) => clean(x, 40)).slice(0, 1000);
  await db(env).batch(ids.map((id, i) => db(env).prepare("UPDATE entries SET position = ? WHERE id = ?").bind(i + 1, id)));
  return json({ ok: true });
});

/* small lists for the pickers (products, tiles, bookstores) */
route("GET pick", async ({ env, url }) => {
  const t = requireType(clean(url.searchParams.get("type"), 40));
  const list = await listEntries(env, t.type, { limit: 2000 });
  return json({
    items: list.map((e) => {
      const label = String(e.data[t.displayKey ?? ""] ?? e.data.title ?? e.data.label ?? e.data.name ?? e.handle);
      const img = (e.data.images as string[] | undefined)?.[0] ?? (e.data.image as string | undefined) ?? (e.data.photo as string | undefined);
      return { id: e.id, handle: e.handle, label, sub: String(e.data.kind ?? e.data.subtitle ?? e.data.location ?? ""), image: img ? mediaUrl(img) : "", status: e.status };
    }),
  });
});

route("POST upload", async ({ request, env, who }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") throw new HttpError(400, "No file received.");
  const n = (k: string) => {
    const v = Number(form?.get(k));
    return Number.isFinite(v) && v > 0 ? Math.round(v) : undefined;
  };
  return json(await saveMedia(env, file, { uploadedBy: `admin:${who}`, allowVideo: true, width: n("width"), height: n("height"), duration: n("duration"), alt: String(form?.get("alt") ?? "") }));
});

/* ---- orders ---- */
route("GET orders", async ({ env, url }) => {
  const status = clean(url.searchParams.get("status"), 20);
  const list = await listOrders(env, { status: status || undefined, q: clean(url.searchParams.get("q"), 80) || undefined, offset: Number(url.searchParams.get("offset")) || 0, limit: 50 });
  return json({ orders: list });
});

route("GET order", async ({ env, url }) => {
  const o = await getOrder(env, clean(url.searchParams.get("id"), 40));
  if (!o) throw new HttpError(404, "Order not found.");
  return json({ order: o });
});

const LABEL: Record<string, string> = { paid: "Paid — to pack", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

route("POST order", async ({ request, env, who, waitUntil }) => {
  const b = await body(request);
  let o: Order | null = await getOrder(env, clean(b.id, 40));
  if (!o) throw new HttpError(404, "Order not found.");
  const by = who === "owner" ? "" : ` (${who})`;
  const action = clean(b.action, 20);
  if (action === "note") {
    o = await addHistory(env, o.id, `Note updated${by}`, { note: clean(b.note, 2000) });
  } else if (action === "status") {
    const status = clean(b.status, 20);
    if (!LABEL[status]) throw new HttpError(400, "Unknown status.");
    if (o.payment_status === "unpaid") throw new HttpError(400, "This order was never paid, so it can't be packed or shipped.");
    const extra: Record<string, unknown> = { status };
    if (status === "shipped") {
      extra.courier = clean(b.courier, 80);
      extra.tracking_number = clean(b.tracking_number, 80);
      const t = clean(b.tracking_url, 500);
      if (t && !/^https?:\/\//.test(t)) throw new HttpError(400, "The tracking link must start with https://");
      extra.tracking_url = t;
    }
    if (status === "cancelled" && b.refund === true && o.total - o.refunded > 0 && o.razorpay_payment_id) {
      o = await refundPayment(env, o, o.total - o.refunded);
    }
    o = await addHistory(env, o.id, `Marked as ${LABEL[status]}${by}`, extra);
    if (o.email && b.notify !== false) {
      const m = status === "shipped" ? shippedEmail(env, mailView(o)) : status === "delivered" ? deliveredEmail(env, mailView(o)) : status === "cancelled" ? cancelledEmail(env, mailView(o)) : null;
      if (m) waitUntil(sendQuietly(env, { to: o.email, ...m }));
    }
  } else if (action === "refund") {
    const amount = Math.round(Number(b.amount));
    o = await refundPayment(env, o, amount);
    if (o.email) waitUntil(sendQuietly(env, { to: o.email, ...refundEmail(env, mailView(o), amount) }));
  } else throw new HttpError(400, "Unknown action.");
  return json({ order: o });
});

/* ---- chats: the team's reply goes into the conversation (and to the customer's email if we have it) ---- */
route("POST chat-reply", async ({ request, env, who, waitUntil }) => {
  const b = await body(request);
  const e = await getById(env, clean(b.id, 40));
  if (!e || e.type !== "ak_chat") throw new HttpError(404, "Chat not found.");
  const text = clean(b.text, 2000);
  if (!text) throw new HttpError(400, "Please type a reply.");
  const messages = [...((Array.isArray(e.data.messages) ? e.data.messages : []) as ChatMsg[]), { from: "team" as const, text, at: now(), by: who }].slice(-300);
  const updated = await updateEntry(env, e.id, {
    data: { messages, conversation: chatLog(String(e.data.name ?? "Customer"), messages), last_message_at: now(), status: b.resolve === true ? "Resolved" : "Waiting for customer", reply: undefined },
  });
  const to = String(e.data.customer_email ?? "") || (/@/.test(String(e.data.contact ?? "")) ? String(e.data.contact) : "");
  if (to && b.email !== false)
    waitUntil(
      sendQuietly(env, {
        to,
        subject: "AapkiKitab Team replied to your message",
        text: `${text}\n\nReply on aapkikitab.in (tap the chat button).`,
        html: `<p style="font-family:Arial;font-size:15px">${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!).replace(/\n/g, "<br>")}</p><p style="font-family:Arial;font-size:13px;color:#777">— AapkiKitab Team · reply by opening the chat on aapkikitab.in</p>`,
      }),
    );
  return json({ entry: updated });
});

/* ---- "Publish now": rebuild the website straight away (otherwise it happens every 15 minutes) ---- */
route("POST publish", async ({ env }) => {
  if (!env.GITHUB_DISPATCH_TOKEN) return json({ ok: false, message: "Changes go live automatically within 15 minutes." });
  const repo = env.GITHUB_REPO || "Issei-Kun9/aapkikitab-web";
  const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/dispatches`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`, accept: "application/vnd.github+json", "user-agent": "aapkikitab-admin", "content-type": "application/json" },
    body: JSON.stringify({ ref: "main" }),
  });
  if (!r.ok) throw new HttpError(502, "Couldn't start publishing. Changes will still go live within 15 minutes.");
  return json({ ok: true, message: "Publishing — the website updates in about 3 minutes." });
});

route("POST test-email", async ({ env, who }) => {
  const to = who.includes("@") ? who : adminEmails(env)[0];
  if (!to) throw new HttpError(400, "No admin email is set.");
  await sendEmail(env, { to, subject: "AapkiKitab test email ✅", text: "Emails from your website are working.", html: "<p>Emails from your website are working. ✅</p>" });
  return json({ ok: true, to });
});

async function dispatch(ctx: Ctx) {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/$/, "");
  const key = `${ctx.request.method} ${path}`;
  const h = routes[key];
  if (!h) throw new HttpError(404, "Unknown admin action.");
  if (ctx.request.method !== "GET") sameSite(ctx.env, ctx.request);
  const who = open.has(key) ? "" : await requireAdmin(ctx.env, ctx.request);
  const res = await h({ ...ctx, who, url });
  res.headers.set("cache-control", "no-store");
  return res;
}

export const onRequest = handle(dispatch);

