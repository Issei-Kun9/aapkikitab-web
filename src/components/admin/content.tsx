"use client";
/* Lists and editors for every content type (products, homepage, menus, tiles, policies …). */
import { useCallback, useEffect, useMemo, useState } from "react";
import { TYPES, typeOf, type ContentType } from "../../../shared/content-types";
import { api, del, mediaSrc, post, put, type Entry } from "./api";
import { FieldInput, loadPick } from "./fields";
import { Button, Card, cx, Empty, inputCls, PageTitle, Pill, Spinner, useConfirm, useToast } from "./ui";

export const labelOf = (t: ContentType, e: Entry) =>
  String(e.data[t.displayKey ?? ""] ?? e.data.title ?? e.data.label ?? e.data.name ?? e.data.heading ?? "") || (t.single ? t.name : "Untitled");

const thumbOf = (e: Entry) => {
  const k = (e.data.images as string[] | undefined)?.[0] ?? (e.data.image as string) ?? (e.data.photo as string) ?? (e.data.hero_photo as string) ?? (e.data.media as string[] | undefined)?.[0];
  return k && !/\.(mp4|webm|mov)$/.test(k) ? mediaSrc(k) : "";
};

const FRIENDLY: Record<string, { emoji: string; plural: string }> = {
  product: { emoji: "📚", plural: "Products" },
  ak_homepage: { emoji: "🏠", plural: "Homepage settings" },
  ak_promo_slide: { emoji: "🎞️", plural: "Banner slides" },
  ak_shortcut: { emoji: "🔘", plural: "Shortcut buttons" },
  ak_trust_item: { emoji: "🛡️", plural: "Trust strip" },
  ak_promo_tile: { emoji: "🎴", plural: "Promo cards" },
  ak_budget: { emoji: "💰", plural: "Budget ranges" },
  ak_gift_box: { emoji: "🎁", plural: "Gift boxes" },
  ak_tile: { emoji: "🏷️", plural: "Categories, moods & exams" },
  ak_bookstore: { emoji: "🏬", plural: "Partner bookstores" },
  ak_link: { emoji: "🧭", plural: "Menu links" },
  ak_shop_info: { emoji: "🚚", plural: "Shop details" },
  policy: { emoji: "📜", plural: "Policy pages" },
  ak_post: { emoji: "⭐", plural: "Reviews" },
  ak_comment: { emoji: "💭", plural: "Comments" },
  ak_chat: { emoji: "💬", plural: "Chats" },
  ak_message: { emoji: "🚩", plural: "Reports & messages" },
};
export const friendly = (type: string) => FRIENDLY[type] ?? { emoji: "📄", plural: typeOf(type)?.name ?? type };

/* ---- "Website" overview: every editable part of the site, grouped ---- */
export function WebsiteHome() {
  const groups: { title: string; text: string; types: string[] }[] = [
    { title: "Homepage", text: "The big banner, top bar, buttons and cards on the first page.", types: ["ak_homepage", "ak_promo_slide", "ak_shortcut", "ak_promo_tile", "ak_trust_item", "ak_budget", "ak_gift_box"] },
    { title: "Shelves", text: "How books are grouped, and the shops they come from.", types: ["ak_tile", "ak_bookstore"] },
    { title: "Menus", text: "Links at the top and bottom of every page.", types: ["ak_link"] },
    { title: "Shop settings", text: "Delivery text, contact details and your policies.", types: ["ak_shop_info", "policy"] },
  ];
  return (
    <div>
      <PageTitle title="Website" sub="Change anything customers see. Changes go live on aapkikitab.in within 15 minutes." />
      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-[17px] font-bold text-ink">{g.title}</h2>
            <p className="mb-2 text-[14px] text-muted">{g.text}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {g.types.map((type) => {
                const t = typeOf(type)!;
                return (
                  <a key={type} href={`#/content/${type}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:border-ak-600">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ak-50 text-[22px]">{friendly(type).emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-[15.5px] font-bold text-ink">{friendly(type).plural}</span>
                      <span className="line-clamp-2 block text-[13px] leading-snug text-muted">{t.help.replace(/ Changes show on the website within \d+ minutes\./, "")}</span>
                    </span>
                    <span className="ml-auto text-[20px] text-muted">›</span>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ---- list of entries of one type ---- */
export function EntryList({ type }: { type: string }) {
  const t = typeOf(type);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");
  const [moving, setMoving] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    api<{ entries: Entry[] }>(`entries?type=${type}${type === "ak_chat" || type === "ak_message" || type === "ak_post" || type === "ak_comment" ? "&order=recent" : ""}`)
      .then((r) => setEntries(r.entries))
      .catch((e) => toast(e.message, "error"));
  }, [type, toast]);
  useEffect(() => {
    load();
  }, [load]);

  // single types (Homepage settings, Shop details) open straight in the editor
  useEffect(() => {
    if (t?.single && entries) {
      if (entries[0]) location.replace(`#/content/${type}/${entries[0].id}`);
      else location.replace(`#/content/${type}/new`);
    }
  }, [t, entries, type]);

  const shown = useMemo(
    () =>
      (entries ?? []).filter(
        (e) => (filter === "all" || e.status === filter) && (!q || JSON.stringify(e.data).toLowerCase().includes(q.toLowerCase()) || e.handle.includes(q.toLowerCase())),
      ),
    [entries, filter, q],
  );
  if (!t) return <Empty emoji="🤔" title="This page doesn't exist." />;
  // order matters for homepage parts, menus and tiles — not for products, reviews or chats
  const ordered = !t.single && !["product", "ak_chat", "ak_message", "ak_post", "ak_comment", "policy"].includes(type);

  const move = async (i: number, d: number) => {
    if (!entries) return;
    const next = [...entries];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    setEntries(next);
    setMoving(true);
    try {
      await post("reorder", { type, ids: next.map((e) => e.id) });
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setMoving(false);
  };

  return (
    <div>
      <PageTitle
        title={friendly(type).plural}
        sub={t.help}
        back="#/website"
        action={!t.single && type !== "ak_chat" && type !== "ak_message" ? <Button href={`#/content/${type}/new`}>＋ Add new</Button> : undefined}
      />
      {(entries?.length ?? 0) > 6 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <input className={cx(inputCls, "max-w-xs")} placeholder="🔎 Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          {t.publishable && (
            <div className="flex gap-1 rounded-xl bg-white p-1">
              {(["all", "active", "draft"] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={cx("rounded-lg px-3 py-2 text-[14px] font-bold", filter === f ? "bg-ak-800 text-white" : "text-ink")}>
                  {f === "all" ? "All" : f === "active" ? "Live" : "Hidden"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {!entries ? (
        <div className="py-10 text-center text-muted">
          <Spinner /> Loading…
        </div>
      ) : !shown.length ? (
        <Empty emoji={friendly(type).emoji} title={entries.length ? "Nothing matches your search." : "Nothing here yet."}>
          {!entries.length && !t.single && type !== "ak_chat" && <a className="font-bold text-ak-800 underline" href={`#/content/${type}/new`}>Add the first one</a>}
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((e) => {
            const i = entries.indexOf(e);
            const thumb = thumbOf(e);
            const hidden = e.data.active === false || e.status === "draft";
            return (
              <div key={e.id} className="flex items-center gap-2 rounded-2xl border border-line bg-white p-2.5">
                <a href={`#/content/${type}/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ak-50 text-[20px]">{friendly(type).emoji}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-bold text-ink">{labelOf(t, e)}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                      {hidden ? <Pill tone="grey">Hidden</Pill> : <Pill tone="green">Live</Pill>}
                      {type === "product" && <span>₹{String(e.data.price ?? "")}</span>}
                      {type === "product" && typeof e.data.stock === "number" && <span>· {e.data.stock === 0 ? "Sold out" : `${e.data.stock} left`}</span>}
                      {type === "ak_tile" && <span>{String(e.data.kind ?? "")}</span>}
                      {type === "ak_link" && <span>{String(e.data.placement ?? "")}</span>}
                      {type === "policy" && <span>{String(e.data.section ?? "")}</span>}
                      {(type === "ak_chat" || type === "ak_message") && <span>{String(e.data.status ?? "")}</span>}
                    </span>
                  </span>
                </a>
                {ordered && !q && filter === "all" && (
                  <span className="flex shrink-0 flex-col gap-1">
                    <button type="button" disabled={i === 0 || moving} onClick={() => move(i, -1)} className="h-8 w-9 rounded-lg border border-line text-[13px] disabled:opacity-25" aria-label="Move up">
                      ▲
                    </button>
                    <button type="button" disabled={i === entries.length - 1 || moving} onClick={() => move(i, 1)} className="h-8 w-9 rounded-lg border border-line text-[13px] disabled:opacity-25" aria-label="Move down">
                      ▼
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {ordered && (entries?.length ?? 0) > 1 && <p className="mt-3 text-[13px] text-muted">Use ▲ ▼ to change the order on the website.</p>}
    </div>
  );
}

/* ---- edit (or add) one entry ---- */
export function EntryEditor({ type, id }: { type: string; id: string }) {
  const t = typeOf(type);
  const isNew = id === "new";
  const [entry, setEntry] = useState<Entry | null>(null);
  // a new entry starts with sensible defaults (shown on the website, a book)
  const [data, setData] = useState<Record<string, unknown>>(() => {
    const d: Record<string, unknown> = {};
    if (!isNew) return d;
    for (const f of t?.fields ?? []) {
      if (f.key === "active" && f.type === "boolean") d.active = true;
      if (f.key === "kind" && type === "product") d.kind = "Book";
    }
    return d;
  });
  const [status, setStatus] = useState<"active" | "draft">(t?.publishable ? "draft" : "active");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    if (isNew) return;
    api<{ entry: Entry }>(`entry?id=${id}`)
      .then((r) => {
        setEntry(r.entry);
        setData(r.entry.data);
        setStatus(r.entry.status);
      })
      .catch((e) => toast(e.message, "error"));
  }, [id, isNew, toast]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    (window as unknown as { akDirty?: boolean }).akDirty = dirty;
    return () => {
      window.removeEventListener("beforeunload", warn);
      (window as unknown as { akDirty?: boolean }).akDirty = false;
    };
  }, [dirty]);

  if (!t) return <Empty emoji="🤔" title="This page doesn't exist." />;
  if (!isNew && !entry) return <div className="py-10 text-center text-muted"><Spinner /> Loading…</div>;

  const set = (k: string, v: unknown) => {
    setData((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const visible = Object.fromEntries(t.fields.filter((f) => !f.hidden && !f.readonly).map((f) => [f.key, data[f.key]]));
      if (isNew) {
        const r = await post<{ entry: Entry }>("entry", { type, data: visible, status });
        setDirty(false);
        toast("Saved!");
        loadPick(type, true);
        location.replace(`#/content/${type}/${r.entry.id}`);
      } else {
        const r = await put<{ entry: Entry }>("entry", { id, data: visible, status });
        setEntry(r.entry);
        setData(r.entry.data);
        setDirty(false);
        loadPick(type, true);
        toast(status === "draft" && t.publishable ? "Saved (hidden from the website)." : "Saved! It shows on the website within 15 minutes.");
      }
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!(await ask("Delete this?", `“${labelOf(t, { ...(entry as Entry), data })}” will be removed for good. ${t.publishable || "active" in data ? "To only hide it, use “Hidden” instead." : ""}`, { yes: "Delete", danger: true }))) return;
    try {
      await del(`entry?id=${id}`);
      setDirty(false);
      loadPick(type, true);
      toast("Deleted.");
      location.replace(`#/content/${type}`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const title = isNew ? `New ${t.name.toLowerCase()}` : labelOf(t, { ...(entry as Entry), data });
  return (
    <div className="pb-28">
      <PageTitle title={title} sub={t.help} back={t.single ? "#/website" : `#/content/${type}`} />
      {t.publishable && (
        <Card className="mb-3">
          <p className="mb-2 text-[15px] font-bold text-ink">Show on the website?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus("active");
                setDirty(true);
              }}
              className={cx("rounded-xl border-2 p-3 text-left", status === "active" ? "border-leaf bg-[#e3f6ec]" : "border-line")}
            >
              <span className="block text-[15px] font-bold text-ink">🟢 Live</span>
              <span className="text-[13px] text-muted">Customers can see it</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus("draft");
                setDirty(true);
              }}
              className={cx("rounded-xl border-2 p-3 text-left", status === "draft" ? "border-ak-800 bg-ak-50" : "border-line")}
            >
              <span className="block text-[15px] font-bold text-ink">⚪ Hidden</span>
              <span className="text-[13px] text-muted">Only you can see it</span>
            </button>
          </div>
        </Card>
      )}
      <Card>
        <div className="flex flex-col gap-5">
          {t.fields.map((f) => (
            <FieldInput key={f.key} f={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />
          ))}
        </div>
      </Card>
      {type === "product" && !isNew && entry && (
        <p className="mt-3 text-[14px] text-muted">
          On the website: <a className="font-bold text-ak-800 underline" href={`/book/${entry.handle}`} target="_blank" rel="noreferrer">aapkikitab.in/book/{entry.handle}</a> (new products appear within 15 minutes)
        </p>
      )}
      {!isNew && !t.single && (
        <div className="mt-6">
          <Button kind="danger" onClick={remove}>
            🗑 Delete
          </Button>
        </div>
      )}
      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="flex-1 text-[14px] font-semibold text-muted">{dirty ? "You have changes that aren't saved yet." : "All changes saved."}</span>
          <Button onClick={save} busy={saving} disabled={!dirty && !isNew}>
            💾 Save
          </Button>
        </div>
      </div>
      {dialog}
    </div>
  );
}

export const allTypes = TYPES;
