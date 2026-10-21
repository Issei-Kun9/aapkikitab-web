/* Photos and videos: bytes in Cloudflare KV, details in D1. Served at /media/<key>. */
import { db, HttpError, randomId, type Env, type KVNamespace } from "./core";

const TYPES: Record<string, { ext: string; video: boolean }> = {
  "image/jpeg": { ext: "jpg", video: false },
  "image/png": { ext: "png", video: false },
  "image/webp": { ext: "webp", video: false },
  "image/gif": { ext: "gif", video: false },
  "image/avif": { ext: "avif", video: false },
  "video/mp4": { ext: "mp4", video: true },
  "video/webm": { ext: "webm", video: true },
  "video/quicktime": { ext: "mov", video: true },
};
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 24 * 1024 * 1024; // KV values are capped at 25 MB

function kv(env: Env): KVNamespace {
  if (!env.MEDIA) throw new HttpError(503, "Photo storage is being set up. Please try again in a few minutes.");
  return env.MEDIA;
}

export const isVideoKey = (key: string) => /\.(mp4|webm|mov)$/.test(key);
export const mediaUrl = (key: string) => (key ? `/media/${key}` : "");

export async function saveMedia(env: Env, file: File, opts: { uploadedBy: string; allowVideo: boolean; alt?: string; width?: number; height?: number; duration?: number }) {
  const t = TYPES[file.type];
  if (!t || (t.video && !opts.allowVideo)) throw new HttpError(400, opts.allowVideo ? "Please choose a photo or a video." : "Please choose a photo (JPG, PNG or WebP).");
  const max = t.video ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) throw new HttpError(400, t.video ? "Videos can be up to 24 MB. Please choose a shorter clip." : "Photos can be up to 10 MB.");
  const key = `${randomId(12)}.${t.ext}`;
  await kv(env).put(key, await file.arrayBuffer(), { metadata: { type: file.type } });
  await db(env)
    .prepare("INSERT INTO media (key, content_type, size, width, height, duration, alt, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(key, file.type, file.size, opts.width ?? null, opts.height ?? null, opts.duration ?? null, (opts.alt ?? "").slice(0, 200), opts.uploadedBy)
    .run();
  return { key, url: mediaUrl(key), kind: t.video ? "video" : "image", width: opts.width ?? null, height: opts.height ?? null };
}

export interface MediaRow {
  key: string;
  content_type: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  alt: string;
}

export async function mediaInfo(env: Env, keys: string[]) {
  if (!keys.length) return new Map<string, MediaRow>();
  const r = await db(env)
    .prepare(`SELECT key, content_type, width, height, duration, alt FROM media WHERE key IN (${keys.map(() => "?").join(",")})`)
    .bind(...keys)
    .all<MediaRow>();
  return new Map(r.results.map((m) => [m.key, m]));
}

export async function serveMedia(env: Env, key: string, request: Request) {
  if (!/^[a-z0-9]{6,40}\.(jpg|png|webp|gif|avif|mp4|webm|mov)$/.test(key)) return new Response("Not found", { status: 404 });
  const type = Object.entries(TYPES).find(([, v]) => key.endsWith(`.${v.ext}`))?.[0] ?? "application/octet-stream";
  const headers: Record<string, string> = { "content-type": type, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff", "accept-ranges": "bytes" };
  const range = request.headers.get("range");
  if (isVideoKey(key) && range) {
    // phones (iPhone Safari especially) only play videos that can be fetched in parts
    const buf = await kv(env).get(key, "arrayBuffer");
    if (!buf) return new Response("Not found", { status: 404 });
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const size = buf.byteLength;
    let start = m?.[1] ? Number(m[1]) : 0;
    let end = m?.[2] ? Number(m[2]) : size - 1;
    if (!m?.[1] && m?.[2]) {
      start = Math.max(0, size - Number(m[2]));
      end = size - 1;
    }
    end = Math.min(end, size - 1);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    return new Response(buf.slice(start, end + 1), { status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) } });
  }
  const { value } = await kv(env).getWithMetadata<{ type?: string }>(key, "stream");
  if (!value) return new Response("Not found", { status: 404 });
  return new Response(value, { headers });
}
