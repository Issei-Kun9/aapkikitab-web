"use client";
/* One input per field type, driven by shared/content-types.ts. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { FieldDef } from "../../../shared/content-types";
import { api, isVideo, mediaSrc, uploadFile } from "./api";
import { Button, cx, Help, inputCls, Sheet, Toggle, useToast } from "./ui";

type V = unknown;

export function FieldInput({ f, value, onChange }: { f: FieldDef; value: V; onChange: (v: V) => void }) {
  if (f.hidden) return null;
  const id = `f-${f.key}`;
  const label = (
    <label htmlFor={id} className="mb-1.5 block text-[15px] font-bold text-ink">
      {f.name}
      {f.required && <span className="text-rose"> *</span>}
    </label>
  );
  const help = f.help ? <Help>{f.help}</Help> : null;

  if (f.readonly) {
    return (
      <div>
        {label}
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-paper p-3 font-sans text-[14px] text-ink">{String(value ?? "—")}</pre>
        {help}
      </div>
    );
  }

  switch (f.type) {
    case "boolean":
      return <Toggle on={value === true} onChange={onChange} label={f.name} help={f.help} />;
    case "text":
    case "url":
      return (
        <div>
          {label}
          <input id={id} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} inputMode={f.type === "url" ? "url" : undefined} placeholder={f.type === "url" ? "https://…" : ""} />
          {help}
        </div>
      );
    case "multiline":
      return (
        <div>
          {label}
          <textarea id={id} className={cx(inputCls, "min-h-[110px]")} rows={f.key === "body" ? 14 : 4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
          {help}
        </div>
      );
    case "number":
      return (
        <div>
          {label}
          <input
            id={id}
            className={cx(inputCls, "max-w-[220px]")}
            inputMode="numeric"
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, ""))}
          />
          {help}
        </div>
      );
    case "date":
      return (
        <div>
          {label}
          <input id={id} type="date" className={cx(inputCls, "max-w-[220px]")} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
          {help}
        </div>
      );
    case "datetime":
      return (
        <div>
          {label}
          <p className="text-[15px] text-ink">{value ? new Date(String(value)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—"}</p>
          {help}
        </div>
      );
    case "choice":
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {(f.choices ?? []).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(value === c && !f.required ? "" : c)}
                className={cx("rounded-full border-2 px-4 py-2 text-[14.5px] font-semibold", value === c ? "border-ak-800 bg-ak-800 text-white" : "border-line bg-white text-ink hover:border-ak-600")}
              >
                {c}
              </button>
            ))}
          </div>
          {help}
        </div>
      );
    case "list.choice": {
      const list = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {(f.choices ?? []).map((c) => {
              const on = list.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? list.filter((x) => x !== c) : [...list, c])}
                  className={cx("rounded-full border-2 px-4 py-2 text-[14.5px] font-semibold", on ? "border-leaf bg-[#e3f6ec] text-leaf" : "border-line bg-white text-ink hover:border-ak-600")}
                >
                  {on ? "✓ " : ""}
                  {c}
                </button>
              );
            })}
          </div>
          {help}
        </div>
      );
    }
    case "list.text":
      return (
        <div>
          {label}
          <textarea
            id={id}
            className={cx(inputCls, "min-h-[90px]")}
            value={Array.isArray(value) ? (value as string[]).join("\n") : String(value ?? "")}
            onChange={(e) => onChange(e.target.value.split("\n"))}
            placeholder="One per line"
          />
          {help ?? <Help>One per line.</Help>}
        </div>
      );
    case "file":
    case "list.file":
      return (
        <div>
          {label}
          <MediaField multiple={f.type === "list.file"} video={f.media === "image+video"} value={value} onChange={onChange} />
          {help}
        </div>
      );
    case "product":
    case "ref":
    case "list.ref":
      return (
        <div>
          {label}
          <RefField type={f.type === "product" ? "product" : f.ref ?? ""} multiple={f.type === "list.ref"} value={value} onChange={onChange} />
          {help}
        </div>
      );
    case "json":
      return null;
  }
}

/* ---- photos / videos ---- */
function MediaField({ multiple, video, value, onChange }: { multiple: boolean; video: boolean; value: V; onChange: (v: V) => void }) {
  const list = multiple ? (Array.isArray(value) ? (value as string[]) : []) : value ? [String(value)] : [];
  const [busy, setBusy] = useState(0);
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const chosen = multiple ? [...files].slice(0, 10) : [files[0]];
    setBusy(chosen.length);
    const keys: string[] = [];
    for (const file of chosen) {
      try {
        keys.push((await uploadFile(file)).key);
      } catch (e) {
        toast((e as Error).message, "error");
      }
      setBusy((n) => n - 1);
    }
    if (keys.length) onChange(multiple ? [...list, ...keys] : keys[0]);
    if (input.current) input.current.value = "";
  };
  const move = (i: number, d: number) => {
    const next = [...list];
    const [x] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + d)), 0, x);
    onChange(next);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {list.map((k, i) => (
          <div key={k} className="relative w-[104px]">
            {isVideo(k) ? (
              <video src={mediaSrc(k)} className="h-[104px] w-[104px] rounded-xl border border-line bg-ink object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaSrc(k)} alt="" className="h-[104px] w-[104px] rounded-xl border border-line bg-paper object-cover" />
            )}
            {multiple && i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">Cover</span>}
            <div className="mt-1 flex justify-between">
              {multiple ? (
                <span className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="h-8 w-8 rounded-lg border border-line text-[14px] disabled:opacity-30" aria-label="Move left">
                    ←
                  </button>
                  <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="h-8 w-8 rounded-lg border border-line text-[14px] disabled:opacity-30" aria-label="Move right">
                    →
                  </button>
                </span>
              ) : (
                <span />
              )}
              <button type="button" onClick={() => onChange(multiple ? list.filter((x) => x !== k) : "")} className="h-8 rounded-lg border border-rose/30 px-2 text-[12.5px] font-bold text-rose" aria-label="Remove photo">
                Remove
              </button>
            </div>
          </div>
        ))}
        {(multiple || list.length === 0) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex h-[104px] w-[104px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ak-600/40 bg-ak-50 text-[13px] font-bold text-ak-800 hover:border-ak-800"
          >
            {busy ? (
              <span>Uploading…</span>
            ) : (
              <>
                <span className="text-[26px] leading-none">＋</span>
                {multiple ? "Add photos" : list.length ? "Change" : "Add photo"}
              </>
            )}
          </button>
        )}
        {!multiple && list.length > 0 && (
          <button type="button" onClick={() => input.current?.click()} className="self-start text-[14px] font-bold text-ak-800 underline">
            {busy ? "Uploading…" : "Change photo"}
          </button>
        )}
      </div>
      <input ref={input} type="file" hidden multiple={multiple} accept={video ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"} onChange={(e) => add(e.target.files)} />
    </div>
  );
}

/* ---- pick a product / tile / bookstore ---- */
interface PickItem {
  id: string;
  handle: string;
  label: string;
  sub: string;
  image: string;
  status: string;
}
const pickCache = new Map<string, Promise<PickItem[]>>();
export const loadPick = (type: string, fresh = false) => {
  if (fresh) pickCache.delete(type);
  if (!pickCache.has(type)) pickCache.set(type, api<{ items: PickItem[] }>(`pick?type=${type}`).then((r) => r.items));
  return pickCache.get(type)!;
};

function RefField({ type, multiple, value, onChange }: { type: string; multiple: boolean; value: V; onChange: (v: V) => void }) {
  const ids = multiple ? (Array.isArray(value) ? (value as string[]) : []) : value ? [String(value)] : [];
  const [items, setItems] = useState<PickItem[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    loadPick(type).then(setItems).catch(() => setItems([]));
  }, [type]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const shown = items.filter((i) => !q || `${i.label} ${i.sub}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => {
    if (!multiple) {
      onChange(id);
      setOpen(false);
      return;
    }
    onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };
  // group tiles by their section so "Shows under" is easy to scan
  const groups = useMemo(() => {
    const g = new Map<string, PickItem[]>();
    for (const i of shown) g.set(i.sub || "", [...(g.get(i.sub || "") ?? []), i]);
    return [...g.entries()];
  }, [shown]);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => {
          const it = byId.get(id);
          return (
            <span key={id} className="inline-flex items-center gap-2 rounded-full border border-ak-800/20 bg-ak-50 py-1 pl-1.5 pr-1 text-[14px] font-semibold text-ink">
              {it?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              {it?.label ?? "…"}
              <button type="button" onClick={() => onChange(multiple ? ids.filter((x) => x !== id) : "")} className="grid h-6 w-6 place-items-center rounded-full text-[13px] hover:bg-white" aria-label={`Remove ${it?.label ?? ""}`}>
                ✕
              </button>
            </span>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="rounded-full border-2 border-dashed border-ak-600/40 px-4 py-1.5 text-[14px] font-bold text-ak-800 hover:border-ak-800">
          {ids.length ? (multiple ? "＋ Pick more" : "Change") : "＋ Pick"}
        </button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Pick from the list" footer={multiple ? <Button className="w-full" onClick={() => setOpen(false)}>Done ({ids.length} picked)</Button> : undefined}>
        <input className={inputCls} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="mt-3 flex flex-col gap-3">
          {groups.map(([g, list]) => (
            <div key={g}>
              {g && groups.length > 1 && <p className="mb-1 text-[12.5px] font-bold uppercase tracking-wide text-muted">{g}</p>}
              <div className="flex flex-col gap-1.5">
                {list.map((i) => {
                  const on = ids.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => toggle(i.id)}
                      className={cx("flex items-center gap-3 rounded-xl border-2 p-2 text-left", on ? "border-leaf bg-[#f0faf4]" : "border-line hover:border-ak-600")}
                    >
                      {i.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ak-50 text-[18px]">📘</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-ink">{i.label}</span>
                        {i.status === "draft" && <span className="text-[12px] font-bold text-muted">Hidden (Draft)</span>}
                      </span>
                      <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px] font-bold", on ? "bg-leaf text-white" : "border-2 border-line")}>{on ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!shown.length && <p className="py-6 text-center text-muted">Nothing found.</p>}
        </div>
      </Sheet>
    </div>
  );
}
