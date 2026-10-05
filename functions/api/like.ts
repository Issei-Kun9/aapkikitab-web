/* POST /api/like { id, delta: 1 | -1, target?: "reply" } → likes on a post, its team reply, or a comment. */
import { admin, check, configured, handle, HttpError, json, sameSite, UPDATE_METAOBJECT } from "../../server/shopify";

const READ = `query($id: ID!, $key: String!) { metaobject(id: $id) { type capabilities { publishable { status } } field(key: $key) { value } } }`;

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Not available yet.");
  const { id, delta, target } = (await request.json().catch(() => ({}))) as { id?: string; delta?: number; target?: string };
  if (typeof id !== "string" || !id.startsWith("gid://shopify/Metaobject/")) throw new HttpError(400, "Unknown post.");
  const key = target === "reply" ? "reply_likes" : "likes";
  const m = (await admin<{ metaobject: { type: string; capabilities: { publishable: { status: string } | null }; field: { value: string | null } | null } | null }>(env, READ, { id, key })).metaobject;
  if (!m || !["ak_post", "ak_comment"].includes(m.type) || m.capabilities.publishable?.status !== "ACTIVE") throw new HttpError(404, "Unknown post.");
  const likes = Math.max(0, (Number(m.field?.value ?? 0) || 0) + (delta === -1 ? -1 : 1));
  const u = await admin<{ metaobjectUpdate: { userErrors: { message: string }[] } }>(env, UPDATE_METAOBJECT, { id, input: { fields: [{ key, value: String(likes) }] } });
  check(u.metaobjectUpdate);
  return json({ likes });
});
