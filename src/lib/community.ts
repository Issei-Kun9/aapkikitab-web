/* Reviews + team chat. Talks to the Cloudflare Pages Functions in /functions/api; the team
   moderates and replies in the admin panel. Signed-in customers are recognised by their cookie. */
import { getSession } from "./account";

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
  if (auth && !getSession()) throw new Error("Please sign in first.");
  const r = await fetch(path, { credentials: "same-origin", ...init });
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

/* photos are made smaller first; videos send their size and length for the review card */
async function prepare(file: File, body: FormData) {
  if (file.type.startsWith("video/")) {
    if (file.size > 24 * 1024 * 1024) throw new Error("Videos can be up to 24 MB. Please choose a shorter clip.");
    const info = await new Promise<{ w: number; h: number; d: number }>((res) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => res({ w: v.videoWidth, h: v.videoHeight, d: Math.round(v.duration || 0) });
      v.onerror = () => res({ w: 0, h: 0, d: 0 });
      v.src = URL.createObjectURL(file);
    });
    body.append("file", file);
    body.append("width", String(info.w));
    body.append("height", String(info.h));
    body.append("duration", String(info.d));
    return;
  }
  const bmp = /^image\/(jpeg|png|webp)$/.test(file.type) ? await createImageBitmap(file).catch(() => null) : null;
  if (!bmp) return void body.append("file", file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/webp", 0.86));
  body.append("file", blob && blob.size < file.size ? new File([blob], "photo.webp", { type: "image/webp" }) : file);
  body.append("width", String(c.width));
  body.append("height", String(c.height));
}

export async function uploadMedia(file: File, attach = false) {
  const body = new FormData();
  await prepare(file, body);
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
  const r = await fetch("/api/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
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
