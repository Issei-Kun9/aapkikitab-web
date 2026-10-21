/* GET /api/order?id= → one order. The id is a long random code (sent only to the buyer),
   so the "thank you" page works even before the customer signs in. */
import { handle, HttpError, json } from "../../server/core";
import { customerOrderView, getOrder } from "../../server/orders";

export const onRequestGet = handle(async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const o = id.length >= 12 ? await getOrder(env, id) : null;
  if (!o || o.status === "pending") throw new HttpError(404, "Order not found.");
  return json({ order: customerOrderView(o) }, 200, { "cache-control": "no-store" });
});
