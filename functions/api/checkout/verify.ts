/* POST /api/checkout/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   → after Razorpay says "paid", check its signature and mark the order paid. */
import { body, clean, handle, HttpError, json, sameSite } from "../../../server/core";
import { markPaid, verifyCheckoutSignature } from "../../../server/orders";

export const onRequestPost = handle(async ({ request, env, waitUntil }) => {
  sameSite(env, request);
  const b = await body(request);
  const orderId = clean(b.razorpay_order_id, 80);
  const paymentId = clean(b.razorpay_payment_id, 80);
  const sig = clean(b.razorpay_signature, 200);
  if (!orderId || !paymentId || !(await verifyCheckoutSignature(env, orderId, paymentId, sig))) throw new HttpError(400, "We couldn't confirm the payment. If money was taken, contact us and we'll sort it out.");
  const o = await markPaid(env, orderId, paymentId, waitUntil);
  return json({ ok: true, orderId: o.id, number: o.number });
});
