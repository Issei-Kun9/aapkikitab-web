/* Shared helpers for the Cloudflare Pages Functions in /functions.
   Everything the shop owner manages lives in our own database (Cloudflare D1), photos and
   videos in Cloudflare KV, and payments go straight to Razorpay. */

/* ---- the bits of the Cloudflare runtime we use ---- */
export interface D1Result<T> {
  results: T[];
  meta: { changes: number; last_row_id: number };
}
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<never>>;
}
export interface D1Database {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<D1Result<unknown>[]>;
}
export interface KVNamespace {
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  getWithMetadata<M>(key: string, type: "stream"): Promise<{ value: ReadableStream | null; metadata: M | null }>;
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: { metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB?: D1Database;
  MEDIA?: KVNamespace;
  SITE_ORIGIN?: string;
  /* sign-in codes and order emails (resend.com) */
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string; // e.g. "AapkiKitab <orders@aapkikitab.in>"
  /* admin panel: comma-separated emails that may sign in, and an optional password */
  ADMIN_EMAILS?: string;
  ADMIN_PASSWORD?: string;
  /* payments */
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  /* optional: lets "Publish now" in admin start a website rebuild right away */
  GITHUB_DISPATCH_TOKEN?: string;
  GITHUB_REPO?: string;
  /* local testing only: sign-in codes are printed instead of emailed */
  DEV_MODE?: string;
}

export interface Ctx {
  request: Request;
  env: Env;
  params?: Record<string, string | string[]>;
  waitUntil: (p: Promise<unknown>) => void;
}

export const originOf = (env: Env) => env.SITE_ORIGIN || "https://aapkikitab.in";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function db(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, "The shop is being set up. Please try again in a few minutes.");
  return env.DB;
}

export const configured = (env: Env) => Boolean(env.DB);

export function handle(fn: (ctx: Ctx) => Promise<Response>) {
  return async (ctx: Ctx) => {
    try {
      return await fn(ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

/* Same-site writes only: browsers send Origin on POST. */
export function sameSite(env: Env, request: Request) {
  const o = request.headers.get("origin");
  if (o && o !== originOf(env) && !o.startsWith("http://localhost") && !o.startsWith("http://127.0.0.1")) throw new HttpError(403, "Not allowed.");
}

export const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "";

export const body = async (request: Request) => (await request.json().catch(() => ({}))) as Record<string, unknown>;

export const now = () => new Date().toISOString();

const ALPHA = "abcdefghijkmnopqrstuvwxyz23456789";
export function randomId(len = 16) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHA[b % ALPHA.length]).join("");
}

export async function sha256(text: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* constant-time string compare */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || randomId(8);

export function parseJson<T>(text: string | null | undefined, fallback: T): T {
  try {
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
