/* POST /api/razorpay-webhook ← Razorpay (payment.captured / order.paid). Backup for when the
   customer closes the tab before the browser could confirm the payment. */
import { handle, json } from "../../server/core";
import { markPaid, verifyWebhook } from "../../server/orders";

export const onRequestPost = handle(async ({ request, env, waitUntil }) => {
  const raw = await request.text();
  if (!(await verifyWebhook(env, raw, request.headers.get("x-razorpay-signature") ?? ""))) return json({ error: "bad signature" }, 400);
  const e = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id: string; order_id: string; status: string } } } };
  const p = e.payload?.payment?.entity;
  if ((e.event === "payment.captured" || e.event === "order.paid") && p?.order_id && p.status === "captured") {
    await markPaid(env, p.order_id, p.id, waitUntil).catch(() => null);
  }
  return json({ ok: true });
});
