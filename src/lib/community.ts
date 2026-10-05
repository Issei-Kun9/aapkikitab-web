/* Reader stories + team chat. Talks to the Cloudflare Pages Functions in /functions/api,
   which keep everything in Shopify so the team moderates from Shopify admin. */
import { freshToken } from "./customer-account";

export type PostMedia = { type: "image"; url: string; w: number; h: number } | { type: "video"; url: string; poster: string; duration: number };
export interface Comment {
  id: string;
  name: string;
  text: string;
  likes: number;
  at: string;
}
export interface Post {
  id: string;
  name: string;
  text: string;
  rating: number | null;
  likes: number;
  verified: boolean;
  reply: string;
  replyLikes: number;
  replyAt: string;
  pinned: boolean;
  at: string;
  media: PostMedia[];
  book: { handle: string; title: string; image: string } | null;
  comments: Comment[];
}

async function call<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (auth) {
    const token = await freshToken();
    if (!token) throw new Error("Please sign in first.");
    headers.set("authorization", token);
  }
  const r = await fetch(path, { ...init, headers });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

export const fetchPosts = () => call<{ posts: Post[]; setup: boolean }>("/api/posts");

/* Posting and chat stay hidden until the server side is switched on. */
let readyP: Promise<boolean> | null = null;
export const communityReady = () =>
  (readyP ??= fetch("/api/status")
    .then((r) => (r.ok ? r.json() : { ready: false }))
    .then((j: { ready?: boolean }) => Boolean(j.ready))
    .catch(() => false));

const LIKED = "ak_liked";
export function likedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIKED) ?? "[]");
  } catch {
    return [];
  }
}
/* key: post id, comment id, or `${postId}#reply` for the team reply */
export async function toggleLike(key: string, like: boolean): Promise<number> {
  const set = new Set(likedIds());
  if (like) set.add(key);
  else set.delete(key);
  localStorage.setItem(LIKED, JSON.stringify([...set]));
  const [id, target] = key.split("#");
  const r = await call<{ likes: number }>("/api/like", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, delta: like ? 1 : -1, target }),
  });
  return r.likes;
}

export async function uploadMedia(file: File, attach = false) {
  const body = new FormData();
  body.append("file", file);
  if (attach) body.append("attach", "1");
  return call<{ url: string; kind: "image" | "video" }>("/api/upload", { method: "POST", body }, true);
}

const json = (b: unknown): RequestInit => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
export const sendComment = (post: string, text: string) => call<{ ok: true }>("/api/comment", json({ post, text }), true);
export const reportPost = (post: string, reason: string) => call<{ ok: true }>("/api/report", json({ post, reason }));

/* ---- two-way support chat ---- */
export interface ChatMsg {
  from: "customer" | "team";
  text: string;
  image?: string;
  at: string;
}
const CHAT = "ak_chat";
export function chatRef(): { id: string; key: string } | null {
  try {
    return JSON.parse(localStorage.getItem(CHAT) ?? "null");
  } catch {
    return null;
  }
}
export async function loadChat(): Promise<ChatMsg[]> {
  const ref = chatRef();
  if (!ref) return [];
  const r = await call<{ messages: ChatMsg[] }>(`/api/chat?id=${encodeURIComponent(ref.id)}&key=${encodeURIComponent(ref.key)}`);
  return r.messages;
}
export async function sendChat(m: { text: string; image?: string; name?: string; contact?: string; website?: string }): Promise<ChatMsg[]> {
  const ref = chatRef();
  const token = await freshToken().catch(() => null);
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: token } : {}) },
    body: JSON.stringify({ ...m, ...(ref ?? {}) }),
  });
  const j = (await r.json().catch(() => ({}))) as { id?: string; key?: string; messages?: ChatMsg[]; error?: string };
  if (!r.ok) throw new Error(j.error || "Message not sent. Please try again.");
  if (j.id && j.key) localStorage.setItem(CHAT, JSON.stringify({ id: j.id, key: j.key }));
  return j.messages ?? [];
}

export const createPost = (p: { text: string; rating?: number; book?: string; media: { url: string; kind: string }[] }) =>
  call<{ ok: true }>("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) }, true);


export const timeAgo = (iso: string) => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
