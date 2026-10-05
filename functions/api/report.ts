/* POST /api/report { post, reason } → flags a post for the team (Customer message, topic "Report"). */
import { admin, check, clean, configured, CREATE_METAOBJECT, handle, HttpError, json, sameSite } from "../../server/shopify";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Not available yet.");
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const post = clean(b.post, 80);
  if (!post.startsWith("gid://shopify/Metaobject/")) throw new HttpError(400, "Unknown post.");
  const d = await admin<{ metaobjectCreate: { userErrors: { message: string }[] } }>(env, CREATE_METAOBJECT, {
    input: {
      type: "ak_message",
      fields: [
        { key: "name", value: "Website visitor" },
        { key: "contact", value: "-" },
        { key: "topic", value: "Report" },
        { key: "message", value: `Reported post ${post}: ${clean(b.reason, 300) || "no reason given"}` },
        { key: "page", value: "/community" },
        { key: "status", value: "New" },
        { key: "received_at", value: new Date().toISOString() },
      ],
    },
  });
  check(d.metaobjectCreate);
  return json({ ok: true });
});
