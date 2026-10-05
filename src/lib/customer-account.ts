/* Customer accounts through Shopify's Customer Account API (Headless channel, public client).
   Sign-in is Shopify's emailed one-time code; everything after it (orders, addresses, profile)
   is shown on our own pages. Runs entirely in the browser with PKCE, so the static site needs
   no server. */
import { ACCOUNT_URL } from "@/data/settings";

export const CLIENT_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_CLIENT_ID ?? "";
const SHOP_ID = ACCOUNT_URL.match(/shopify\.com\/(\d+)/)?.[1] ?? "";
const AUTH = `https://shopify.com/authentication/${SHOP_ID}`;
const API = `https://shopify.com/${SHOP_ID}/account/customer/api/2026-10/graphql`;
const SCOPE = "openid email customer-account-api:full";

/* Without a client ID the site falls back to Shopify's hosted account pages. */
export const onSiteAccounts = Boolean(CLIENT_ID && SHOP_ID);

const KEY = "ak_session";
const PENDING = "ak_auth_pending";

interface Session {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

const redirectUri = () => `${window.location.origin}/account/callback`;

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

function read<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  return typeof window === "undefined" ? null : read<Session>(localStorage, KEY);
}

const saveSession = (t: { access_token: string; refresh_token: string; id_token?: string; expires_in: number }, prev?: Session | null) => {
  const s: Session = {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    idToken: t.id_token ?? prev?.idToken ?? "",
    expiresAt: Date.now() + (t.expires_in - 60) * 1000,
  };
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("ak-session"));
  return s;
};

export async function signIn(returnTo = "/account") {
  const verifier = random(48);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const state = random(16);
  const nonce = random(16);
  sessionStorage.setItem(PENDING, JSON.stringify({ verifier, state, nonce, returnTo }));
  const url = new URL(`${AUTH}/oauth/authorize`);
  url.search = new URLSearchParams({
    scope: SCOPE,
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    locale: "en",
    region_country: "IN",
  }).toString();
  window.location.assign(url.toString());
}

async function tokenRequest(body: Record<string, string>) {
  const r = await fetch(`${AUTH}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  if (!r.ok) throw new Error(`Sign-in failed (${r.status})`);
  return r.json();
}

/* /account/callback: swap the one-time code for tokens. Returns where to go next. */
export async function finishSignIn(params: URLSearchParams): Promise<string> {
  const pending = read<{ verifier: string; state: string; returnTo: string }>(sessionStorage, PENDING);
  sessionStorage.removeItem(PENDING);
  if (params.get("error")) throw new Error(params.get("error_description") || "Sign-in was cancelled.");
  const code = params.get("code");
  if (!pending || !code || params.get("state") !== pending.state) throw new Error("This sign-in link has expired. Please try again.");
  saveSession(await tokenRequest({ grant_type: "authorization_code", redirect_uri: redirectUri(), code, code_verifier: pending.verifier }));
  return pending.returnTo || "/account";
}

export async function freshToken(): Promise<string | null> {
  const s = getSession();
  if (!s) return null;
  if (Date.now() < s.expiresAt) return s.accessToken;
  try {
    return saveSession(await tokenRequest({ grant_type: "refresh_token", refresh_token: s.refreshToken }), s).accessToken;
  } catch {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("ak-session"));
    return null;
  }
}

export async function customerQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
  const token = await freshToken();
  if (!token) return null;
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ query, variables }),
  });
  if (r.status === 401) {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("ak-session"));
    return null;
  }
  const j = await r.json();
  if (j.errors?.length) throw new Error(j.errors[0].message);
  return j.data as T;
}

export function signOut() {
  const s = getSession();
  localStorage.removeItem(KEY);
  localStorage.removeItem("ak_profile");
  window.dispatchEvent(new Event("ak-session"));
  const url = new URL(`${AUTH}/logout`);
  if (s?.idToken) url.searchParams.set("id_token_hint", s.idToken);
  url.searchParams.set("post_logout_redirect_uri", `${window.location.origin}/account`);
  window.location.assign(url.toString());
}

/* ---- what the account page shows ---- */
export interface Money { amount: string; currencyCode: string }
export interface AccountOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  cancelledAt: string | null;
  statusPageUrl: string;
  totalPrice: Money;
  totalRefunded: Money;
  lineItems: { nodes: { title: string; quantity: number; image: { url: string } | null }[] };
  fulfillments: { nodes: { status: string | null; latestShipmentStatus: string | null; estimatedDeliveryAt: string | null; trackingInformation: { company: string | null; number: string | null; url: string | null }[] }[] };
}
export interface AccountCustomer {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: { emailAddress: string | null } | null;
  phoneNumber: { phoneNumber: string } | null;
  defaultAddress: { id: string; formatted: string[]; firstName: string | null; lastName: string | null; address1: string | null; address2: string | null; city: string | null; province: string | null; zip: string | null; phoneNumber: string | null } | null;
  addresses: { nodes: { id: string; formatted: string[] }[] };
  orders: { nodes: AccountOrder[] };
}

export const ACCOUNT_QUERY = `query Account {
  customer {
    firstName lastName displayName
    emailAddress { emailAddress }
    phoneNumber { phoneNumber }
    defaultAddress { id formatted(withName: true) firstName lastName address1 address2 city province zip phoneNumber }
    addresses(first: 10) { nodes { id formatted(withName: true) } }
    orders(first: 25, sortKey: PROCESSED_AT, reverse: true) {
      nodes {
        id name processedAt financialStatus fulfillmentStatus cancelledAt statusPageUrl
        totalPrice { amount currencyCode }
        totalRefunded { amount currencyCode }
        lineItems(first: 4) { nodes { title quantity image { url } } }
        fulfillments(first: 3) { nodes { status latestShipmentStatus estimatedDeliveryAt trackingInformation { company number url } } }
      }
    }
  }
}`;
