/* Everything the public website is built from: active products and content, with photos and
   references resolved. Read by scripts/sync-content.mjs at build time. */
import { publicTypes, listEntries, type Entry } from "./entries";
import { mediaUrl } from "./media";
import type { Env } from "./core";

export interface CatalogEntry {
  id: string;
  handle: string;
  position: number;
  updated_at: string;
  fields: Record<string, unknown>;
}

export async function buildCatalog(env: Env) {
  const types = publicTypes();
  const all = new Map<string, Entry[]>();
  for (const t of types) all.set(t.type, await listEntries(env, t.type, { status: "active", limit: 2000 }));
  const byId = new Map<string, Entry>();
  for (const list of all.values()) for (const e of list) byId.set(e.id, e);

  const resolve = (type: string, e: Entry): CatalogEntry => {
    const t = types.find((x) => x.type === type)!;
    const fields: Record<string, unknown> = {};
    for (const f of t.fields) {
      if (f.hidden && f.key !== "position") continue;
      const v = e.data[f.key];
      if (v === undefined) continue;
      switch (f.type) {
        case "file":
          fields[f.key] = mediaUrl(String(v));
          break;
        case "list.file":
          fields[f.key] = (v as string[]).map(mediaUrl);
          break;
        case "product": {
          const p = byId.get(String(v));
          if (p && p.type === "product") fields[f.key] = p.handle;
          break;
        }
        case "ref": {
          const r = byId.get(String(v));
          if (r) fields[f.key] = { handle: r.handle, ...r.data };
          break;
        }
        case "list.ref":
          fields[f.key] = (v as string[]).map((id) => byId.get(id)).filter(Boolean).map((r) => ({ handle: r!.handle, ...r!.data }));
          break;
        default:
          fields[f.key] = v;
      }
    }
    return { id: e.id, handle: e.handle, position: e.position, updated_at: e.updated_at, fields };
  };

  const out: Record<string, CatalogEntry[]> = {};
  for (const [type, list] of all) out[type] = list.map((e) => resolve(type, e));
  return { generated_at: new Date().toISOString(), entries: out };
}
