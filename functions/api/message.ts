/* POST /api/message → "Chat with AapkiKitab Team": lands in Shopify admin as a Customer message. */
import { admin, check, clean, configured, handle, HttpError, json, sameSite } from "../../server/shopify";

const CREATE = `mutation($input: MetaobjectCreateInput!) { metaobjectCreate(metaobject: $input) { metaobject { id } userErrors { message } } }`;

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Messages are not switched on yet.");
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (clean(b.website, 50)) return json({ ok: true }); // hidden field: bots fill it, people don't
  const name = clean(b.name, 80);
  const contact = clean(b.contact, 120);
  const message = clean(b.message, 2000);
  if (!name) throw new HttpError(400, "Please tell us your name.");
  if (!/^(\+?\d[\d\s-]{8,14}\d|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(contact)) throw new HttpError(400, "Please add a valid mobile number or email so we can reply.");
  if (message.length < 3) throw new HttpError(400, "Please write your message.");
  const fields = [
    { key: "name", value: name },
    { key: "contact", value: contact },
    { key: "topic", value: clean(b.topic, 60) || "General" },
    { key: "message", value: message },
    { key: "page", value: clean(b.page, 200) },
    { key: "status", value: "New" },
    { key: "received_at", value: new Date().toISOString() },
    ...(clean(b.order, 40) ? [{ key: "order", value: clean(b.order, 40) }] : []),
  ];
  const d = await admin<{ metaobjectCreate: { userErrors: { message: string }[] } }>(env, CREATE, { input: { type: "ak_message", fields } });
  check(d.metaobjectCreate);
  return json({ ok: true });
});
