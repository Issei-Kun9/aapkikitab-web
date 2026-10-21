/* Content entries (products, homepage, menus, tiles, reviews, chats, policies …) in D1. */
import { TYPES, typeOf, type ContentType, type FieldDef } from "../shared/content-types";
import { db, HttpError, now, parseJson, randomId, slugify, type Env } from "./core";

export type Data = Record<string, unknown>;

export interface Entry {
  id: string;
  type: string;
  handle: string;
  status: "active" | "draft";
  position: number;
  data: Data;
  created_at: string;
  updated_at: string;
}

interface Row {
  id: string;
  type: string;
  handle: string;
  status: string;
  position: number;
  data: string;
  created_at: string;
  updated_at: string;
}

const toEntry = (r: Row): Entry => ({ ...r, status: r.status === "draft" ? "draft" : "active", data: parseJson<Data>(r.data, {}) });

export function requireType(type: string): ContentType {
  const t = typeOf(type);
  if (!t) throw new HttpError(404, "Unknown content type.");
  return t;
}

export async function getEntry(env: Env, type: string, idOrHandle: string): Promise<Entry | null> {
  const r = await db(env).prepare("SELECT * FROM entries WHERE type = ? AND (id = ? OR handle = ?) LIMIT 1").bind(type, idOrHandle, idOrHandle).first<Row>();
  return r ? toEntry(r) : null;
}

export async function getById(env: Env, id: string): Promise<Entry | null> {
  const r = await db(env).prepare("SELECT * FROM entries WHERE id = ?").bind(id).first<Row>();
  return r ? toEntry(r) : null;
}

export async function listEntries(env: Env, type: string, opts: { status?: "active" | "draft"; limit?: number; offset?: number; order?: "position" | "recent" } = {}) {
  const where = ["type = ?"];
  const args: unknown[] = [type];
  if (opts.status) {
    where.push("status = ?");
    args.push(opts.status);
  }
  const order = opts.order === "recent" ? "updated_at DESC" : "position ASC, created_at ASC";
  const r = await db(env)
    .prepare(`SELECT * FROM entries WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .bind(...args, opts.limit ?? 500, opts.offset ?? 0)
    .all<Row>();
  return r.results.map(toEntry);
}

export async function countByStatus(env: Env, type: string) {
  const r = await db(env).prepare("SELECT status, COUNT(*) AS n FROM entries WHERE type = ? GROUP BY status").bind(type).all<{ status: string; n: number }>();
  return Object.fromEntries(r.results.map((x) => [x.status, x.n])) as Record<string, number>;
}

/* ---- validation: only known fields, each in the right shape ---- */
const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : typeof v === "string" && v.trim() ? v.split("\n") : []);
const str = (v: unknown, max = 20000) => (v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, max);

function coerce(f: FieldDef, v: unknown): unknown {
  if (v === undefined || v === null || v === "") return undefined;
  switch (f.type) {
    case "text":
      return str(v, 500).trim() || undefined;
    case "multiline":
      return str(v).replace(/\r\n/g, "\n").trim() || undefined;
    case "url": {
      const s = str(v, 1000).trim();
      if (!s) return undefined;
      if (!/^https?:\/\//i.test(s)) throw new HttpError(400, `${f.name}: please enter a full link starting with https://`);
      return s;
    }
    case "number": {
      const n = typeof v === "number" ? v : Number(String(v).replace(/[₹,\s]/g, ""));
      if (!Number.isFinite(n)) throw new HttpError(400, `${f.name}: please enter a number.`);
      const i = Math.round(n);
      if (f.min !== undefined && i < f.min) throw new HttpError(400, `${f.name}: must be at least ${f.min}.`);
      if (f.max !== undefined && i > f.max) throw new HttpError(400, `${f.name}: must be at most ${f.max}.`);
      return i;
    }
    case "boolean":
      return v === true || v === "true" || v === "on" || v === 1;
    case "date": {
      const s = str(v, 20).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new HttpError(400, `${f.name}: please pick a date.`);
      return s;
    }
    case "datetime": {
      const d = new Date(String(v));
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }
    case "json":
      return typeof v === "string" ? parseJson(v, undefined) : v;
    case "choice": {
      const s = str(v, 200).trim();
      if (f.choices && !f.choices.includes(s)) throw new HttpError(400, `${f.name}: please pick one of the options.`);
      return s;
    }
    case "list.choice": {
      const l = asList(v).map((x) => str(x, 200).trim()).filter(Boolean);
      if (f.choices && l.some((x) => !f.choices!.includes(x))) throw new HttpError(400, `${f.name}: please pick from the options.`);
      return l.length ? [...new Set(l)] : undefined;
    }
    case "list.text": {
      const l = asList(v).map((x) => str(x, 500).trim()).filter(Boolean);
      return l.length ? l : undefined;
    }
    case "file":
    case "product":
    case "ref":
      return str(v, 120).trim() || undefined;
    case "list.file":
    case "list.ref": {
      const l = asList(v).map((x) => str(x, 120).trim()).filter(Boolean);
      return l.length ? [...new Set(l)] : undefined;
    }
  }
}

export function validate(t: ContentType, input: Data, opts: { partial?: boolean; keepHidden?: Data } = {}): Data {
  const out: Data = {};
  for (const f of t.fields) {
    if (!(f.key in input)) {
      if (opts.keepHidden && f.key in opts.keepHidden) out[f.key] = opts.keepHidden[f.key];
      continue;
    }
    const v = coerce(f, input[f.key]);
    if (v !== undefined) out[f.key] = v;
  }
  if (!opts.partial) {
    const missing = t.fields.find((f) => f.required && (out[f.key] === undefined || (Array.isArray(out[f.key]) && !(out[f.key] as unknown[]).length)));
    if (missing) throw new HttpError(400, `Please fill in “${missing.name}”.`);
  }
  return out;
}

async function uniqueHandle(env: Env, type: string, base: string, selfId?: string) {
  let h = slugify(base);
  for (let i = 2; ; i++) {
    const hit = await db(env).prepare("SELECT id FROM entries WHERE type = ? AND handle = ?").bind(type, h).first<{ id: string }>();
    if (!hit || hit.id === selfId) return h;
    h = `${slugify(base)}-${i}`;
  }
}

export async function createEntry(env: Env, type: string, data: Data, opts: { status?: "active" | "draft"; handle?: string; position?: number; id?: string } = {}) {
  const t = requireType(type);
  const id = opts.id ?? randomId();
  const base = opts.handle || String(data[t.displayKey ?? ""] ?? "") || `${type.replace(/^ak_/, "")}-${id.slice(0, 6)}`;
  const handle = await uniqueHandle(env, type, base);
  const position = opts.position ?? ((await db(env).prepare("SELECT COALESCE(MAX(position), 0) + 1 AS p FROM entries WHERE type = ?").bind(type).first<{ p: number }>())?.p ?? 1);
  const at = now();
  await db(env)
    .prepare("INSERT INTO entries (id, type, handle, status, position, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, type, handle, opts.status ?? (t.publishable ? "draft" : "active"), position, JSON.stringify(data), at, at)
    .run();
  return (await getById(env, id))!;
}

export async function updateEntry(env: Env, id: string, patch: { data?: Data; status?: "active" | "draft"; position?: number; handle?: string }) {
  const e = await getById(env, id);
  if (!e) throw new HttpError(404, "Not found.");
  const data = patch.data ? { ...e.data, ...patch.data } : e.data;
  for (const [k, v] of Object.entries(patch.data ?? {})) if (v === undefined || v === null) delete data[k];
  const handle = patch.handle ? await uniqueHandle(env, e.type, patch.handle, id) : e.handle;
  await db(env)
    .prepare("UPDATE entries SET data = ?, status = ?, position = ?, handle = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(data), patch.status ?? e.status, patch.position ?? e.position, handle, now(), id)
    .run();
  return (await getById(env, id))!;
}

/* Atomic counter change inside data (likes); never below zero. */
export async function bumpCounter(env: Env, id: string, key: string, delta: number) {
  const path = `$.${key.replace(/[^a-z_]/g, "")}`;
  await db(env)
    .prepare(`UPDATE entries SET data = json_set(data, ?, MAX(0, COALESCE(json_extract(data, ?), 0) + ?)) WHERE id = ?`)
    .bind(path, path, delta, id)
    .run();
  const r = await db(env).prepare(`SELECT json_extract(data, ?) AS n FROM entries WHERE id = ?`).bind(path, id).first<{ n: number }>();
  return Number(r?.n ?? 0);
}

export async function deleteEntry(env: Env, id: string) {
  await db(env).prepare("DELETE FROM entries WHERE id = ?").bind(id).run();
}

export const publicTypes = () => TYPES.filter((t) => t.public);
