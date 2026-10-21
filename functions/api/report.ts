/* POST /api/report { post, reason } → flags a review for the team (Customer message, topic "Report"). */
import { body, clean, handle, HttpError, json, now, sameSite } from "../../server/core";
import { createEntry, getById } from "../../server/entries";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  const b = await body(request);
  const post = await getById(env, clean(b.post, 40));
  if (!post || post.type !== "ak_post") throw new HttpError(400, "Unknown post.");
  await createEntry(
    env,
    "ak_message",
    { name: "Website visitor", contact: "-", topic: "Report", message: `Reported review by ${post.data.author_name ?? "a customer"}: ${clean(b.reason, 300) || "no reason given"} [${post.id}]`, page: "/community", status: "New", received_at: now() },
    { status: "active" },
  );
  return json({ ok: true });
});
