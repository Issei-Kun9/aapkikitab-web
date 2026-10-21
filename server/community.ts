/* Reviews, comments and support chat on top of entries. */
import { listEntries, type Entry } from "./entries";
import { mediaInfo, mediaUrl, isVideoKey } from "./media";
import { getById } from "./entries";
import type { Env } from "./core";

export type PostMedia = { type: "image"; url: string; w: number; h: number } | { type: "video"; url: string; poster: string; duration: number };

export async function publicPosts(env: Env) {
  const [posts, comments] = await Promise.all([listEntries(env, "ak_post", { status: "active", limit: 300, order: "recent" }), listEntries(env, "ak_comment", { status: "active", limit: 2000 })]);
  const keys = posts.flatMap((p) => (p.data.media as string[] | undefined) ?? []);
  const info = await mediaInfo(env, keys);
  const books = new Map<string, Entry | null>();
  for (const p of posts) {
    const b = p.data.book as string | undefined;
    if (b && !books.has(b)) books.set(b, await getById(env, b));
  }
  const out = posts.map((p) => {
    const d = p.data;
    const media: PostMedia[] = ((d.media as string[] | undefined) ?? []).map((k) => {
      const m = info.get(k);
      return isVideoKey(k) ? { type: "video", url: mediaUrl(k), poster: "", duration: m?.duration ?? 0 } : { type: "image", url: mediaUrl(k), w: m?.width ?? 800, h: m?.height ?? 800 };
    });
    const book = d.book ? books.get(String(d.book)) : null;
    const bookImages = (book?.data.images as string[] | undefined) ?? [];
    return {
      id: p.id,
      name: String(d.author_name ?? "Reader"),
      text: String(d.text ?? ""),
      rating: typeof d.rating === "number" ? d.rating : null,
      likes: Number(d.likes ?? 0),
      verified: d.verified_purchase === true,
      reply: String(d.team_reply ?? ""),
      replyLikes: Number(d.reply_likes ?? 0),
      replyAt: String(d.reply_at ?? ""),
      pinned: d.featured === true,
      at: String(d.submitted_at ?? p.created_at),
      media,
      book: book && book.status === "active" ? { handle: book.handle, title: String(book.data.title ?? ""), image: bookImages[0] ? mediaUrl(bookImages[0]) : "" } : null,
      comments: [] as { id: string; name: string; text: string; likes: number; at: string }[],
    };
  });
  const byId = new Map(out.map((p) => [p.id, p]));
  for (const c of comments) {
    const post = byId.get(String(c.data.post ?? ""));
    if (post) post.comments.push({ id: c.id, name: String(c.data.author_name ?? "Reader"), text: String(c.data.text ?? ""), likes: Number(c.data.likes ?? 0), at: String(c.data.submitted_at ?? c.created_at) });
  }
  for (const p of out) p.comments.sort((a, b) => a.at.localeCompare(b.at));
  out.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.localeCompare(a.at));
  return out;
}

/* ---- chat ---- */
export interface ChatMsg {
  from: "customer" | "team";
  text: string;
  image?: string;
  at: string;
  by?: string; // team member email (admin view only)
}
const ist = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const chatLog = (name: string, messages: ChatMsg[]) =>
  messages.map((m) => `[${ist(m.at)}] ${m.from === "team" ? "AapkiKitab Team" : name}: ${m.text}${m.image ? " (photo)" : ""}`).join("\n");
export const chatView = (messages: ChatMsg[]) => messages.map(({ from, text, image, at }) => ({ from, text, image, at }));
