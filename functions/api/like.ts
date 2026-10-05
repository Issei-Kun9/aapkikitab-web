/* POST /api/like { id, delta: 1 | -1 } → updates the like count on an approved post. */
import { admin, check, configured, handle, HttpError, json, sameSite } from "../../server/shopify";

const READ = `query($id: ID!) { metaobject(id: $id) { type capabilities { publishable { status } } field(key: "likes") { value } } }`;
const WRITE = `mutation($id: ID!, $input: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $input) { metaobject { id } userErrors { message } } }`;

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Not available yet.");
  const { id, delta } = (await request.json().catch(() => ({}))) as { id?: string; delta?: number };
  if (typeof id !== "string" || !id.startsWith("gid://shopify/Metaobject/")) throw new HttpError(400, "Unknown post.");
  const d = await admin<{ metaobject: { type: string; capabilities: { publishable: { status: string } | null }; field: { value: string | null } | null } | null }>(env, READ, { id });
  const m = d.metaobject;
  if (!m || m.type !== "ak_post" || m.capabilities.publishable?.status !== "ACTIVE") throw new HttpError(404, "Unknown post.");
  const likes = Math.max(0, (Number(m.field?.value ?? 0) || 0) + (delta === -1 ? -1 : 1));
  const u = await admin<{ metaobjectUpdate: { userErrors: { message: string }[] } }>(env, WRITE, { id, input: { fields: [{ key: "likes", value: String(likes) }] } });
  check(u.metaobjectUpdate);
  return json({ likes });
});
