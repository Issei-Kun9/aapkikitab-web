/* Two-way support chat. The team answers in the admin panel (Chats).
   GET  /api/chat?id&key → the conversation
   POST /api/chat { id?, key?, text, name?, contact?, image? } → customer message (starts a chat if needed) */
import { body, clean, handle, HttpError, json, now, randomId, safeEqual, sameSite, type Env } from "../../server/core";
import { currentCustomer, publicName } from "../../server/auth";
import { createEntry, getById, updateEntry, type Entry } from "../../server/entries";
import { chatLog, chatView, type ChatMsg } from "../../server/community";
import { teamEmails } from "../../server/orders";
import { sendQuietly, teamAlert } from "../../server/email";

async function load(env: Env, id: string, key: string) {
  const e = await getById(env, id);
  if (!e || e.type !== "ak_chat" || !key || !safeEqual(String(e.data.access_key ?? ""), key)) throw new HttpError(404, "Chat not found.");
  return { e, messages: (Array.isArray(e.data.messages) ? e.data.messages : []) as ChatMsg[] };
}

/* one alert per quiet spell, not one per message */
function alertTeam(env: Env, e: Entry, messages: ChatMsg[], waitUntil: (p: Promise<unknown>) => void) {
  const prev = messages[messages.length - 2];
  if (prev && prev.from === "customer" && Date.now() - new Date(prev.at).getTime() < 15 * 60_000) return;
  const last = messages[messages.length - 1];
  waitUntil(
    teamEmails(env).then((to) =>
      to.length ? sendQuietly(env, { to, ...teamAlert(env, `💬 New chat message from ${e.data.name ?? "a customer"}`, [last.text || "(photo)", `Contact: ${e.data.contact ?? ""}`], `/admin#/chats/${e.id}`) }) : undefined,
    ),
  );
}

export const onRequestGet = handle(async ({ request, env }) => {
  const u = new URL(request.url);
  const { messages } = await load(env, clean(u.searchParams.get("id"), 40), clean(u.searchParams.get("key"), 80));
  return json({ messages: chatView(messages) }, 200, { "cache-control": "no-store" });
});

export const onRequestPost = handle(async ({ request, env, waitUntil }) => {
  sameSite(env, request);
  const b = await body(request);
  if (clean(b.website, 50)) return json({ ok: true }); // bot trap
  const text = clean(b.text, 1000);
  const image = /^\/media\/[a-z0-9]{6,40}\.(jpg|png|webp|gif|avif)$/.test(String(b.image ?? "")) ? String(b.image) : "";
  if (!text && !image) throw new HttpError(400, "Please type a message.");
  const msg: ChatMsg = { from: "customer", text, ...(image ? { image } : {}), at: now() };
  const customer = await currentCustomer(env, request);

  const id = clean(b.id, 40);
  if (id) {
    const { e, messages } = await load(env, id, clean(b.key, 80));
    const next = [...messages, msg].slice(-300);
    await updateEntry(env, e.id, { data: { messages: next, conversation: chatLog(String(e.data.name ?? "Customer"), next), last_message_at: msg.at, status: "New message" } });
    alertTeam(env, e, next, waitUntil);
    return json({ id: e.id, key: clean(b.key, 80), messages: chatView(next) });
  }

  // first message: who to reply to
  const name = clean(b.name, 80) || (customer ? publicName(customer) : "");
  const contact = clean(b.contact, 120) || customer?.email || "";
  if (!name) throw new HttpError(400, "Please tell us your name.");
  if (!/^(\+?\d[\d\s-]{8,14}\d|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(contact)) throw new HttpError(400, "Please add a valid mobile number or email so we can reach you.");
  const key = randomId(32);
  const messages = [msg];
  const e = await createEntry(
    env,
    "ak_chat",
    {
      name,
      contact,
      status: "New message",
      messages,
      conversation: chatLog(name, messages),
      last_message_at: msg.at,
      access_key: key,
      ...(customer ? { customer_email: customer.email, customer_id: customer.id } : {}),
    },
    { status: "active" },
  );
  alertTeam(env, e, messages, waitUntil);
  return json({ id: e.id, key, messages: chatView(messages) });
});
