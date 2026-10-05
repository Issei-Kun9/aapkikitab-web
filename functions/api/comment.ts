/* POST /api/comment { post, text } → a signed-in customer comments; it waits as Draft for the team. */
import { admin, check, clean, configured, CREATE_METAOBJECT, handle, HttpError, json, sameSite, verifyCustomer } from "../../server/shopify";

const POST = `query($id: ID!) { metaobject(id: $id) { type capabilities { publishable { status } } } }`;

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Comments are not switched on yet.");
  const customer = await verifyCustomer(env, request);
  const b = (await request.json().catch(() => ({}))) as { post?: string; text?: string };
  const text = clean(b.text, 300);
  if (text.length < 2) throw new HttpError(400, "Please write your comment.");
  const post = (await admin<{ metaobject: { type: string; capabilities: { publishable: { status: string } | null } } | null }>(env, POST, { id: b.post })).metaobject;
  if (!post || post.type !== "ak_post" || post.capabilities.publishable?.status !== "ACTIVE") throw new HttpError(404, "This post is no longer available.");
  const d = await admin<{ metaobjectCreate: { userErrors: { message: string }[] } }>(env, CREATE_METAOBJECT, {
    input: {
      type: "ak_comment",
      capabilities: { publishable: { status: "DRAFT" } },
      fields: [
        { key: "author_name", value: customer.name },
        { key: "text", value: text },
        { key: "post", value: b.post },
        { key: "likes", value: "0" },
        { key: "submitted_at", value: new Date().toISOString() },
        { key: "customer_email", value: customer.email },
        { key: "customer_id", value: customer.id },
      ],
    },
  });
  check(d.metaobjectCreate);
  return json({ ok: true });
});
