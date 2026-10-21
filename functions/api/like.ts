/* POST /api/like { id, delta: 1 | -1, target?: "reply" } → likes on a review, its team reply, or a comment. */
import { body, clean, handle, HttpError, json, sameSite } from "../../server/core";
import { bumpCounter, getById } from "../../server/entries";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  const b = await body(request);
  const e = await getById(env, clean(b.id, 40));
  if (!e || !["ak_post", "ak_comment"].includes(e.type) || e.status !== "active") throw new HttpError(404, "Unknown post.");
  const key = b.target === "reply" && e.type === "ak_post" ? "reply_likes" : "likes";
  return json({ likes: await bumpCounter(env, e.id, key, b.delta === -1 ? -1 : 1) });
});
