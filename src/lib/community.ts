/* Reader stories + team chat. Talks to the Cloudflare Pages Functions in /functions/api,
   which keep everything in Shopify so the team moderates from Shopify admin. */
import { freshToken } from "./customer-account";

export type PostMedia = { type: "image"; url: string; w: number; h: number } | { type: "video"; url: string; poster: string };
export interface Post {
  id: string;
  name: string;
  text: string;
  rating: number | null;
  likes: number;
  reply: string;
  pinned: boolean;
  at: string;
  media: PostMedia[];
  book: { handle: string; title: string; image: string } | null;
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
export async function toggleLike(id: string, like: boolean): Promise<number> {
  const set = new Set(likedIds());
  if (like) set.add(id);
  else set.delete(id);
  localStorage.setItem(LIKED, JSON.stringify([...set]));
  const r = await call<{ likes: number }>("/api/like", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, delta: like ? 1 : -1 }),
  });
  return r.likes;
}

export async function uploadMedia(file: File) {
  const body = new FormData();
  body.append("file", file);
  return call<{ url: string; kind: "image" | "video" }>("/api/upload", { method: "POST", body }, true);
}

export const createPost = (p: { text: string; rating?: number; book?: string; media: { url: string; kind: string }[] }) =>
  call<{ ok: true }>("/api/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) }, true);

export const sendMessage = (m: { name: string; contact: string; topic: string; message: string; order?: string; page: string; website?: string }) =>
  call<{ ok: true }>("/api/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(m) });

export const timeAgo = (iso: string) => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
