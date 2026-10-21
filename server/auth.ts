/* Sign-in with a 6-digit code sent by email (customers and the admin team), and sessions. */
import { db, HttpError, isEmail, parseJson, randomId, safeEqual, sha256, type Env } from "./core";
import { sendEmail, codeEmail } from "./email";

type Purpose = "customer" | "admin";
const CODE_MINUTES = 10;
const DAY = 86_400_000;

export const adminEmails = (env: Env) =>
  (env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export async function sendCode(env: Env, rawEmail: string, purpose: Purpose) {
  const email = rawEmail.trim().toLowerCase();
  if (!isEmail(email)) throw new HttpError(400, "Please enter a valid email address.");
  if (purpose === "admin" && !adminEmails(env).includes(email)) {
    // same answer as success, so the admin list can't be guessed
    return { sent: true as const };
  }
  const since = Date.now() - 30 * 60_000;
  const recent = await db(env).prepare("SELECT COUNT(*) AS n FROM login_codes WHERE email = ? AND created_at > ?").bind(email, since).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 5) throw new HttpError(429, "Too many codes requested. Please wait a few minutes and try again.");
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  await db(env)
    .prepare("INSERT INTO login_codes (email, code_hash, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(email, await sha256(`${purpose}:${email}:${code}`), purpose, Date.now() + CODE_MINUTES * 60_000, Date.now())
    .run();
  if (env.DEV_MODE === "1" && !env.RESEND_API_KEY) return { sent: true as const, devCode: code };
  await sendEmail(env, { to: email, ...codeEmail(code, purpose) });
  return { sent: true as const };
}

export async function checkCode(env: Env, rawEmail: string, code: string, purpose: Purpose) {
  const email = rawEmail.trim().toLowerCase();
  const row = await db(env)
    .prepare("SELECT rowid, code_hash, attempts FROM login_codes WHERE email = ? AND purpose = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1")
    .bind(email, purpose, Date.now())
    .first<{ rowid: number; code_hash: string; attempts: number }>();
  if (!row) throw new HttpError(400, "This code has expired. Please ask for a new one.");
  if (row.attempts >= 5) throw new HttpError(429, "Too many wrong tries. Please ask for a new code.");
  const ok = safeEqual(row.code_hash, await sha256(`${purpose}:${email}:${code.replace(/\D/g, "")}`));
  if (!ok) {
    await db(env).prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE rowid = ?").bind(row.rowid).run();
    throw new HttpError(400, "That code is not right. Please check the email and try again.");
  }
  await db(env).prepare("DELETE FROM login_codes WHERE email = ? AND purpose = ?").bind(email, purpose).run();
  if (purpose === "admin" && !adminEmails(env).includes(email)) throw new HttpError(403, "This email can't open the admin panel.");
  return email;
}

/* ---- sessions (HttpOnly cookie holds a random token; the database keeps only its hash) ---- */
const COOKIE = { customer: "ak_session", admin: "ak_admin" } as const;

export async function startSession(env: Env, kind: Purpose, subject: string, days: number) {
  const token = randomId(40);
  const expires = Date.now() + days * DAY;
  await db(env)
    .prepare("INSERT INTO sessions (token_hash, kind, subject, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(await sha256(token), kind, subject, expires, Date.now())
    .run();
  // tidy up old sessions and codes now and then
  if (Math.random() < 0.05) {
    await db(env).batch([
      db(env).prepare("DELETE FROM sessions WHERE expires_at < ?").bind(Date.now()),
      db(env).prepare("DELETE FROM login_codes WHERE expires_at < ?").bind(Date.now() - DAY),
    ]);
  }
  return `${COOKIE[kind]}=${token}; Path=/; Max-Age=${days * 86400}; HttpOnly; Secure; SameSite=Lax`;
}

const cookieValue = (request: Request, name: string) =>
  (request.headers.get("cookie") ?? "").split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";

export async function sessionSubject(env: Env, request: Request, kind: Purpose): Promise<string | null> {
  const token = cookieValue(request, COOKIE[kind]);
  if (!token || !env.DB) return null;
  const r = await db(env).prepare("SELECT subject FROM sessions WHERE token_hash = ? AND kind = ? AND expires_at > ?").bind(await sha256(token), kind, Date.now()).first<{ subject: string }>();
  return r?.subject ?? null;
}

export async function endSession(env: Env, request: Request, kind: Purpose) {
  const token = cookieValue(request, COOKIE[kind]);
  if (token) await db(env).prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return `${COOKIE[kind]}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/* ---- customers ---- */
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
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  addresses: Address[];
}

interface CustomerRow {
  id: string;
  email: string;
  name: string;
  phone: string;
  addresses: string;
}
const toCustomer = (r: CustomerRow): Customer => ({ ...r, addresses: parseJson<Address[]>(r.addresses, []) });

export async function customerByEmail(env: Env, email: string, create = false): Promise<Customer | null> {
  const e = email.trim().toLowerCase();
  const r = await db(env).prepare("SELECT * FROM customers WHERE email = ?").bind(e).first<CustomerRow>();
  if (r) return toCustomer(r);
  if (!create) return null;
  const id = randomId();
  await db(env).prepare("INSERT INTO customers (id, email) VALUES (?, ?)").bind(id, e).run();
  return { id, email: e, name: "", phone: "", addresses: [] };
}

export async function currentCustomer(env: Env, request: Request): Promise<Customer | null> {
  const id = await sessionSubject(env, request, "customer");
  if (!id) return null;
  const r = await db(env).prepare("SELECT * FROM customers WHERE id = ?").bind(id).first<CustomerRow>();
  return r ? toCustomer(r) : null;
}

export async function requireCustomer(env: Env, request: Request): Promise<Customer> {
  const c = await currentCustomer(env, request);
  if (!c) throw new HttpError(401, "Please sign in first.");
  return c;
}

/* "Priya S." — or the part of the email before @ when no name is saved */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const publicName = (c: { name: string; email: string }) => {
  const [first, ...rest] = c.name.trim().split(/\s+/).filter(Boolean);
  if (first) return `${cap(first)}${rest.length ? ` ${rest[rest.length - 1].charAt(0).toUpperCase()}.` : ""}`;
  return cap(c.email.split("@")[0].replace(/[._\d]+/g, " ").trim().split(" ")[0] || "Reader");
};

/* ---- admin ---- */
export async function requireAdmin(env: Env, request: Request): Promise<string> {
  const who = await sessionSubject(env, request, "admin");
  if (!who) throw new HttpError(401, "Please sign in to the admin panel.");
  return who;
}
