/* POST /api/comment { post, text } → a signed-in customer comments; it waits as Draft for the team. */
import { body, clean, handle, HttpError, json, now, sameSite } from "../../server/core";
import { publicName, requireCustomer } from "../../server/auth";
import { createEntry, getById } from "../../server/entries";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  const c = await requireCustomer(env, request);
  const b = await body(request);
  const text = clean(b.text, 300);
  if (text.length < 2) throw new HttpError(400, "Please write your comment.");
  const post = await getById(env, clean(b.post, 40));
  if (!post || post.type !== "ak_post" || post.status !== "active") throw new HttpError(404, "This post is no longer available.");
  await createEntry(env, "ak_comment", { author_name: publicName(c), text, post: post.id, likes: 0, submitted_at: now(), customer_email: c.email, customer_id: c.id }, { status: "draft" });
  return json({ ok: true });
});
