/* Two-way support chat, kept in Shopify (Content → Metaobjects → Support chat).
   GET  /api/chat?id&key → the conversation; a reply the team typed in Shopify is moved into it here
   POST /api/chat { id?, key?, text, name?, contact?, image? } → customer message (starts a chat if needed) */
import { admin, check, clean, configured, CREATE_METAOBJECT, handle, HttpError, json, maybeCustomer, sameSite, UPDATE_METAOBJECT, type Env } from "../../server/shopify";

interface Msg {
  from: "customer" | "team";
  text: string;
  image?: string;
  at: string;
}
const READ = `query($id: ID!) { metaobject(id: $id) { type fields { key value } } }`;

async function load(env: Env, id: string, key: string) {
  if (!id.startsWith("gid://shopify/Metaobject/")) throw new HttpError(404, "Chat not found.");
  const m = (await admin<{ metaobject: { type: string; fields: { key: string; value: string | null }[] } | null }>(env, READ, { id })).metaobject;
  const f = Object.fromEntries((m?.fields ?? []).map((x) => [x.key, x.value ?? ""]));
  if (!m || m.type !== "ak_chat" || !key || f.access_key !== key) throw new HttpError(404, "Chat not found.");
  let messages: Msg[] = [];
  try {
    messages = JSON.parse(f.messages || "[]");
  } catch {
    messages = [];
  }
  return { f, messages };
}

const ist = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const log = (name: string, messages: Msg[]) =>
  messages.map((m) => `[${ist(m.at)}] ${m.from === "team" ? "AapkiKitab Team" : name}: ${m.text}${m.image ? ` (photo: ${m.image})` : ""}`).join("\n");

async function save(env: Env, id: string, name: string, messages: Msg[], extra: { key: string; value: string }[]) {
  const u = await admin<{ metaobjectUpdate: { userErrors: { message: string }[] } }>(env, UPDATE_METAOBJECT, {
    id,
    input: {
      fields: [
        { key: "messages", value: JSON.stringify(messages.slice(-200)) },
        { key: "conversation", value: log(name, messages.slice(-200)) },
        { key: "last_message_at", value: messages[messages.length - 1]?.at ?? new Date().toISOString() },
        ...extra,
      ],
    },
  });
  check(u.metaobjectUpdate);
}

/* A reply typed in Shopify admin becomes a team message, and the box empties for the next one. */
async function collectReply(env: Env, id: string, f: Record<string, string>, messages: Msg[]) {
  const reply = f.reply?.trim();
  if (!reply) return messages;
  const next = [...messages, { from: "team" as const, text: reply, at: new Date().toISOString() }];
  await save(env, id, f.name || "Customer", next, [
    { key: "reply", value: "" },
    { key: "status", value: "Waiting for customer" },
  ]);
  return next;
}

const view = (messages: Msg[]) => messages.map(({ from, text, image, at }) => ({ from, text, image, at }));

export const onRequestGet = handle(async ({ request, env }) => {
  if (!configured(env)) throw new HttpError(503, "Chat is not switched on yet.");
  const u = new URL(request.url);
  const id = u.searchParams.get("id") ?? "";
  const { f, messages } = await load(env, id, u.searchParams.get("key") ?? "");
  return json({ messages: view(await collectReply(env, id, f, messages)) }, 200, { "cache-control": "no-store" });
});

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Chat is not switched on yet.");
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (clean(b.website, 50)) return json({ ok: true }); // bot trap
  const text = clean(b.text, 1000);
  const image = typeof b.image === "string" && b.image.startsWith("https://cdn.shopify.com/") ? b.image : "";
  if (!text && !image) throw new HttpError(400, "Please type a message.");
  const msg: Msg = { from: "customer", text, ...(image ? { image } : {}), at: new Date().toISOString() };
  const customer = await maybeCustomer(env, request);

  const id = clean(b.id, 80);
  if (id) {
    const { f, messages } = await load(env, id, clean(b.key, 80));
    const withReply = await collectReply(env, id, f, messages);
    const next = [...withReply, msg];
    await save(env, id, f.name || "Customer", next, [{ key: "status", value: "New message" }]);
    return json({ id, key: clean(b.key, 80), messages: view(next) });
  }

  // first message: who to reply to
  const name = clean(b.name, 80) || customer?.name || "";
  const contact = clean(b.contact, 120) || customer?.email || "";
  if (!name) throw new HttpError(400, "Please tell us your name.");
  if (!/^(\+?\d[\d\s-]{8,14}\d|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(contact)) throw new HttpError(400, "Please add a valid mobile number or email so we can reach you.");
  const key = crypto.randomUUID();
  const messages = [msg];
  const d = await admin<{ metaobjectCreate: { metaobject: { id: string } | null; userErrors: { message: string }[] } }>(env, CREATE_METAOBJECT, {
    input: {
      type: "ak_chat",
      fields: [
        { key: "name", value: name },
        { key: "contact", value: contact },
        { key: "status", value: "New message" },
        { key: "messages", value: JSON.stringify(messages) },
        { key: "conversation", value: log(name, messages) },
        { key: "last_message_at", value: msg.at },
        { key: "access_key", value: key },
        ...(customer ? [{ key: "customer_email", value: customer.email }, { key: "customer_id", value: customer.id }] : []),
      ],
    },
  });
  check(d.metaobjectCreate);
  return json({ id: d.metaobjectCreate.metaobject!.id, key, messages: view(messages) });
});
