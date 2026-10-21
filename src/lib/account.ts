/* Customer accounts on our own server: sign in with a 6-digit code sent by email.
   The real sign-in lives in a secure cookie; localStorage only remembers who it is, so pages
   can greet the customer without a round-trip. */

export interface Profile {
  email: string;
  name: string;
  phone?: string;
}
export interface Address {
  id: string;
  name: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
  default?: boolean;
}
export interface OrderItem {
  id: string;
  handle: string;
  title: string;
  price: number;
  qty: number;
  image: string;
}
export interface CustomerOrder {
  id: string;
  number: number;
  created_at: string;
  status: "paid" | "packed" | "shipped" | "delivered" | "cancelled";
  payment_status: "paid" | "refunded" | "partially_refunded" | "unpaid" | "failed";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  refunded: number;
  courier: string;
  tracking_number: string;
  tracking_url: string;
  name: string;
  phone: string;
  address: { line: string; city: string; state: string; pincode: string };
}

const ME = "ak_me";
export const onSiteAccounts = true;

export function getSession(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(ME) ?? "null");
  } catch {
    return null;
  }
}

function remember(p: Profile | null) {
  try {
    if (p) {
      localStorage.setItem(ME, JSON.stringify(p));
      // checkout and chat prefill from this
      const prev = JSON.parse(localStorage.getItem("ak_profile") ?? "{}");
      localStorage.setItem("ak_profile", JSON.stringify({ ...prev, email: p.email, ...(p.name ? { name: p.name } : {}), ...(p.phone ? { mobile: p.phone } : {}) }));
    } else {
      localStorage.removeItem(ME);
    }
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event("ak-session"));
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, { credentials: "same-origin", ...init });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}
const send = (body: unknown, method = "POST"): RequestInit => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/* Sign-in lives on /account; come back to where you were afterwards. */
export async function signIn(returnTo = "/account") {
  window.location.assign(`/account?next=${encodeURIComponent(returnTo)}`);
}

export const requestCode = (email: string) => call<{ sent: true; devCode?: string }>("/api/auth/code", send({ email }));

export async function verifyCode(email: string, code: string) {
  const r = await call<{ customer: Profile }>("/api/auth/verify", send({ email, code }));
  remember(r.customer);
  return r.customer;
}

export async function signOut() {
  await call("/api/auth/logout", send({})).catch(() => null);
  remember(null);
}

export async function fetchMe() {
  const r = await call<{ customer: (Profile & { addresses: Address[] }) | null; orders?: CustomerOrder[] }>("/api/me", { cache: "no-store" });
  if (!r.customer) {
    if (getSession()) remember(null);
    return null;
  }
  remember({ email: r.customer.email, name: r.customer.name, phone: r.customer.phone });
  return { customer: r.customer, orders: r.orders ?? [] };
}

export async function saveProfile(patch: { name?: string; phone?: string; addresses?: Address[] }) {
  const r = await call<{ customer: Profile & { addresses: Address[] } }>("/api/me", send(patch, "PATCH"));
  remember({ email: r.customer.email, name: r.customer.name, phone: r.customer.phone });
  return r.customer;
}

export const fetchOrder = (id: string) => call<{ order: CustomerOrder }>(`/api/order?id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) => r.order);
