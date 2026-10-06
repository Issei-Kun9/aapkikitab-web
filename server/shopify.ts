/* Shared helpers for the Cloudflare Pages Functions in /functions.
   Customer posts and team messages live in Shopify (Content → Metaobjects), so the
   shop owner moderates and answers everything from Shopify admin. */

export interface Env {
  SHOPIFY_STORE_DOMAIN?: string; // xxx.myshopify.com
  SHOPIFY_ADMIN_TOKEN?: string; // Admin API access token (custom app), or…
  SHOPIFY_CLIENT_ID?: string; // …a Dev Dashboard app's client credentials
  SHOPIFY_CLIENT_SECRET?: string;
  SHOPIFY_SHOP_ID?: string; // numeric id, for verifying signed-in customers
  SITE_ORIGIN?: string;
}

export interface Ctx {
  request: Request;
  env: Env;
  waitUntil: (p: Promise<unknown>) => void;
}

const API_VERSION = "2026-01";
const domainOf = (env: Env) => env.SHOPIFY_STORE_DOMAIN || "aapki-kitab-iysbgwrj.myshopify.com";
const shopIdOf = (env: Env) => env.SHOPIFY_SHOP_ID || "103306592388";
export const originOf = (env: Env) => env.SITE_ORIGIN || "https://aapkikitab.in";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const configured = (env: Env) => Boolean(env.SHOPIFY_ADMIN_TOKEN || (env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET));

let cachedToken: { value: string; expires: number } | null = null;
async function adminToken(env: Env): Promise<string> {
  if (env.SHOPIFY_ADMIN_TOKEN) return env.SHOPIFY_ADMIN_TOKEN;
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) throw new HttpError(503, "Reviews are not set up yet.");
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.value;
  const r = await fetch(`https://${domainOf(env)}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.SHOPIFY_CLIENT_ID, client_secret: env.SHOPIFY_CLIENT_SECRET }),
  });
  if (!r.ok) throw new HttpError(503, "Could not connect to the shop.");
  const j = (await r.json()) as { access_token: string; expires_in?: number };
  cachedToken = { value: j.access_token, expires: Date.now() + ((j.expires_in ?? 3600) - 300) * 1000 };
  return j.access_token;
}

export async function admin<T = Record<string, unknown>>(env: Env, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`https://${domainOf(env)}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Shopify-Access-Token": await adminToken(env) },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new HttpError(502, `Shop error (${r.status})`);
  const j = (await r.json()) as { data?: T; errors?: { message: string }[] };
  if (j.errors?.length) throw new HttpError(502, j.errors[0].message);
  return j.data as T;
}

/* Every mutation result carries userErrors; surface the first one. */
export function check(result: { userErrors?: { message: string }[] } | undefined) {
  const e = result?.userErrors?.[0];
  if (e) throw new HttpError(400, e.message);
}

export interface Customer {
  id: string;
  name: string;
  email: string;
}

/* A signed-in customer proves who they are with their Customer Account API token. */
export async function verifyCustomer(env: Env, request: Request): Promise<Customer> {
  const token = request.headers.get("authorization");
  if (!token) throw new HttpError(401, "Please sign in first.");
  const r = await fetch(`https://shopify.com/${shopIdOf(env)}/account/customer/api/2026-10/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: token, Origin: originOf(env) },
    body: JSON.stringify({ query: "{ customer { id firstName lastName displayName emailAddress { emailAddress } } }" }),
  });
  if (!r.ok) throw new HttpError(401, "Your sign-in has expired. Please sign in again.");
  const j = (await r.json()) as {
    data?: { customer?: { id: string; firstName: string | null; lastName: string | null; displayName: string; emailAddress: { emailAddress: string | null } | null } };
  };
  const c = j.data?.customer;
  if (!c) throw new HttpError(401, "Your sign-in has expired. Please sign in again.");
  const first = c.firstName?.trim();
  const last = c.lastName?.trim();
  const email = c.emailAddress?.emailAddress ?? "";
  // public name: "Priya S." — or the part of the email before @ when no name is saved
  const name = first ? `${first}${last ? ` ${last.charAt(0)}.` : ""}` : c.displayName?.includes("@") ? c.displayName.split("@")[0] : c.displayName || "Reader";
  return { id: c.id, name, email };
}

export function handle(fn: (ctx: Ctx) => Promise<Response>) {
  return async (ctx: Ctx) => {
    try {
      return await fn(ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

/* Same-site writes only: browsers send Origin on POST. */
export function sameSite(env: Env, request: Request) {
  const o = request.headers.get("origin");
  if (o && o !== originOf(env) && !o.startsWith("http://localhost")) throw new HttpError(403, "Not allowed.");
}

export const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "";

export const CREATE_METAOBJECT = `mutation($input: MetaobjectCreateInput!) { metaobjectCreate(metaobject: $input) { metaobject { id } userErrors { message } } }`;
export const UPDATE_METAOBJECT = `mutation($id: ID!, $input: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $input) { metaobject { id } userErrors { message } } }`;

/* A signed-in customer is optional on some routes (chat). */
export async function maybeCustomer(env: Env, request: Request): Promise<Customer | null> {
  if (!request.headers.get("authorization")) return null;
  try {
    return await verifyCustomer(env, request);
  } catch {
    return null;
  }
}
