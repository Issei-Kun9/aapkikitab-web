/* GET  /api/posts → approved reviews with their approved comments (pinned first, then newest)
   POST /api/posts → a signed-in customer submits a review; it waits as Draft for the team */
import { body, clean, configured, handle, HttpError, json, now, sameSite } from "../../server/core";
import { publicName, requireCustomer } from "../../server/auth";
import { createEntry, getEntry } from "../../server/entries";
import { hasPaidOrder, teamEmails } from "../../server/orders";
import { publicPosts } from "../../server/community";
import { sendQuietly, teamAlert } from "../../server/email";

export const onRequestGet = handle(async ({ env }) => {
  if (!configured(env)) return json({ posts: [], setup: false });
  return json({ posts: await publicPosts(env), setup: true }, 200, { "cache-control": "public, max-age=15" });
});

export const onRequestPost = handle(async ({ request, env, waitUntil }) => {
  sameSite(env, request);
  const c = await requireCustomer(env, request);
  const b = await body(request);
  const text = clean(b.text, 500);
  if (text.length < 5) throw new HttpError(400, "Please write a few words about your experience.");
  const media = (Array.isArray(b.media) ? b.media : [])
    .slice(0, 5)
    .map((m: { url?: unknown }) => /^\/media\/([a-z0-9]{6,40}\.[a-z0-9]{2,5})$/.exec(String(m?.url ?? ""))?.[1])
    .filter(Boolean) as string[];
  const rating = Math.round(Number(b.rating));
  const handleStr = clean(b.book, 120);
  const book = handleStr ? await getEntry(env, "product", handleStr) : null;
  const e = await createEntry(
    env,
    "ak_post",
    {
      author_name: publicName(c),
      text,
      likes: 0,
      verified_purchase: await hasPaidOrder(env, c.id, c.email),
      submitted_at: now(),
      customer_email: c.email,
      customer_id: c.id,
      ...(rating >= 1 && rating <= 5 ? { rating } : {}),
      ...(media.length ? { media } : {}),
      ...(book ? { book: book.id } : {}),
    },
    { status: "draft" },
  );
  waitUntil(
    teamEmails(env).then((to) =>
      to.length ? sendQuietly(env, { to, ...teamAlert(env, `⭐ New review from ${publicName(c)} — waiting for approval`, [text.slice(0, 200)], `/admin#/reviews/${e.id}`) }) : undefined,
    ),
  );
  return json({ ok: true });
});
