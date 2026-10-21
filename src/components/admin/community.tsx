"use client";
/* Reviews (approve / reply / pin) and support chats. */
import { useCallback, useEffect, useRef, useState } from "react";
import { ago, api, del, isVideo, mediaSrc, post, put, when, type Entry } from "./api";
import { Button, Card, cx, Empty, inputCls, PageTitle, Pill, Spinner, useConfirm, useToast } from "./ui";

/* ---- reviews ---- */
export function Reviews() {
  const [tab, setTab] = useState<"draft" | "active">("draft");
  const [posts, setPosts] = useState<Entry[] | null>(null);
  const [comments, setComments] = useState<Entry[]>([]);
  const toast = useToast();
  const load = useCallback(() => {
    Promise.all([api<{ entries: Entry[] }>(`entries?type=ak_post&status=${tab}&order=recent`), api<{ entries: Entry[] }>(`entries?type=ak_comment&status=draft&order=recent`)])
      .then(([p, c]) => {
        setPosts(p.entries);
        setComments(c.entries);
      })
      .catch((e) => toast(e.message, "error"));
  }, [tab, toast]);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageTitle title="Reviews" sub="Customers' reviews wait here until you approve them. Approved reviews show on the website within a minute." />
      <div className="mb-3 flex gap-1.5">
        {(["draft", "active"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cx("rounded-full px-4 py-2 text-[14px] font-bold", tab === t ? "bg-ak-800 text-white" : "border border-line bg-white")}>
            {t === "draft" ? "⏳ Waiting for you" : "🟢 Live on website"}
          </button>
        ))}
      </div>
      {!posts ? (
        <div className="py-10 text-center text-muted"><Spinner /> Loading…</div>
      ) : !posts.length ? (
        <Empty emoji="⭐" title={tab === "draft" ? "No reviews waiting. 🎉" : "No live reviews yet."} />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <ReviewCard key={p.id} p={p} onChange={load} />
          ))}
        </div>
      )}
      {comments.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-[18px] font-bold text-ink">💭 Comments waiting ({comments.length})</h2>
          <div className="flex flex-col gap-2">
            {comments.map((c) => (
              <CommentCard key={c.id} c={c} onChange={load} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewCard({ p, onChange }: { p: Entry; onChange: () => void }) {
  const d = p.data;
  const [reply, setReply] = useState(String(d.team_reply ?? ""));
  const [busy, setBusy] = useState("");
  const toast = useToast();
  const { ask, dialog } = useConfirm();
  const save = async (label: string, patch: { status?: "active" | "draft"; data?: Record<string, unknown> }, msg: string) => {
    setBusy(label);
    try {
      await put("entry", { id: p.id, ...(patch.status ? { status: patch.status } : {}), ...(patch.data ? { data: { ...d, ...patch.data } } : {}) });
      toast(msg);
      onChange();
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setBusy("");
  };
  const media = (d.media as string[] | undefined) ?? [];
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[16px] font-bold text-ink">{String(d.author_name ?? "Customer")}</span>
        {typeof d.rating === "number" && <span className="text-marigold">{"★".repeat(d.rating)}<span className="text-line">{"★".repeat(5 - d.rating)}</span></span>}
        {d.verified_purchase === true && <Pill tone="green">✔ Bought from you</Pill>}
        {d.featured === true && <Pill tone="purple">📌 Pinned</Pill>}
        <span className="ml-auto text-[13px] text-muted">{ago(String(d.submitted_at ?? p.created_at))}</span>
      </div>
      <p className="mt-2 whitespace-pre-line text-[15.5px] text-ink">{String(d.text ?? "")}</p>
      {media.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {media.map((k) =>
            isVideo(k) ? (
              <video key={k} src={mediaSrc(k)} controls className="h-32 rounded-xl bg-ink" />
            ) : (
              <a key={k} href={mediaSrc(k)} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaSrc(k)} alt="" className="h-32 w-32 rounded-xl border border-line object-cover" />
              </a>
            ),
          )}
        </div>
      )}
      {d.customer_email ? <p className="mt-2 text-[12.5px] text-muted">Private: {String(d.customer_email)}</p> : null}
      <div className="mt-3">
        <label className="mb-1 block text-[14px] font-bold text-ink">💜 Reply as AapkiKitab Team (optional)</label>
        <textarea className={cx(inputCls, "min-h-[70px]")} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank you so much! Happy reading 💜" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.status === "draft" ? (
          <Button kind="success" busy={busy === "live"} onClick={() => save("live", { status: "active", data: { team_reply: reply.trim() || undefined } }, "Approved! It's on the website.")}>
            ✅ Approve & show
          </Button>
        ) : (
          <>
            {reply !== String(d.team_reply ?? "") && <Button busy={busy === "reply"} onClick={() => save("reply", { data: { team_reply: reply.trim() || undefined } }, "Reply saved.")}>💾 Save reply</Button>}
            <Button kind="secondary" busy={busy === "pin"} onClick={() => save("pin", { data: { featured: d.featured !== true } }, d.featured === true ? "Unpinned." : "Pinned to the top.")}>
              {d.featured === true ? "📌 Unpin" : "📌 Pin to top"}
            </Button>
            <Button kind="secondary" busy={busy === "hide"} onClick={() => save("hide", { status: "draft" }, "Hidden from the website.")}>
              🙈 Hide
            </Button>
          </>
        )}
        <Button
          kind="danger"
          onClick={async () => {
            if (!(await ask("Delete this review?", "It will be removed for good, with its comments.", { yes: "Delete", danger: true }))) return;
            await del(`entry?id=${p.id}`).then(() => toast("Deleted.")).catch((e) => toast(e.message, "error"));
            onChange();
          }}
        >
          🗑 Delete
        </Button>
      </div>
      {dialog}
    </Card>
  );
}

function CommentCard({ c, onChange }: { c: Entry; onChange: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Card className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-ink">{String(c.data.author_name ?? "Customer")}</p>
        <p className="text-[15px] text-ink">{String(c.data.text ?? "")}</p>
      </div>
      <Button small kind="success" busy={busy} onClick={async () => {
        setBusy(true);
        await put("entry", { id: c.id, status: "active" }).then(() => toast("Comment approved.")).catch((e) => toast(e.message, "error"));
        setBusy(false);
        onChange();
      }}>✅ Approve</Button>
      <Button small kind="danger" onClick={async () => {
        await del(`entry?id=${c.id}`).then(() => toast("Deleted.")).catch((e) => toast(e.message, "error"));
        onChange();
      }}>🗑</Button>
    </Card>
  );
}

/* ---- chats ---- */
interface Msg {
  from: "customer" | "team";
  text: string;
  image?: string;
  at: string;
}

export function Chats() {
  const [list, setList] = useState<Entry[] | null>(null);
  const [tab, setTab] = useState<"open" | "Resolved">("open");
  const toast = useToast();
  useEffect(() => {
    const load = () =>
      api<{ entries: Entry[] }>("entries?type=ak_chat&order=recent")
        .then((r) => setList(r.entries))
        .catch((e) => toast(e.message, "error"));
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [toast]);
  const shown = (list ?? []).filter((c) => (tab === "open" ? c.data.status !== "Resolved" : c.data.status === "Resolved"));
  return (
    <div>
      <PageTitle title="Chats" sub="Messages from “Chat with AapkiKitab Team” on the website. Tap one to reply." />
      <div className="mb-3 flex gap-1.5">
        {(["open", "Resolved"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cx("rounded-full px-4 py-2 text-[14px] font-bold", tab === t ? "bg-ak-800 text-white" : "border border-line bg-white")}>
            {t === "open" ? "💬 Open" : "✅ Done"}
          </button>
        ))}
      </div>
      {!list ? (
        <div className="py-10 text-center text-muted"><Spinner /> Loading…</div>
      ) : !shown.length ? (
        <Empty emoji="💬" title={tab === "open" ? "No open chats. 🎉" : "Nothing here yet."} />
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((c) => {
            const msgs = (c.data.messages as Msg[] | undefined) ?? [];
            const last = msgs[msgs.length - 1];
            const fresh = c.data.status === "New message";
            return (
              <a key={c.id} href={`#/chats/${c.id}`} className={cx("flex items-center gap-3 rounded-2xl border bg-white p-3.5", fresh ? "border-ak-800/40" : "border-line")}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ak-50 text-[17px] font-bold text-ak-800">{String(c.data.name ?? "?").charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15.5px] font-bold text-ink">{String(c.data.name ?? "Customer")}</span>
                    {fresh && <Pill tone="amber">New</Pill>}
                  </span>
                  <span className="block truncate text-[14px] text-muted">
                    {last?.from === "team" ? "You: " : ""}
                    {last?.text || (last?.image ? "📷 Photo" : "")}
                  </span>
                </span>
                <span className="shrink-0 text-[12.5px] text-muted">{last ? ago(last.at) : ""}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatThread({ id }: { id: string }) {
  const [c, setC] = useState<Entry | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const end = useRef<HTMLDivElement>(null);
  const load = useCallback(() => api<{ entry: Entry }>(`entry?id=${id}`).then((r) => setC(r.entry)).catch((e) => toast(e.message, "error")), [id, toast]);
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);
  const msgs = ((c?.data.messages as Msg[] | undefined) ?? []);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [msgs.length]);
  if (!c) return <div className="py-10 text-center text-muted"><Spinner /> Loading…</div>;
  const contact = String(c.data.contact ?? "");
  const phone = contact.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const send = async (resolve = false) => {
    if (!text.trim() && !resolve) return;
    setBusy(true);
    try {
      if (text.trim()) {
        const r = await post<{ entry: Entry }>("chat-reply", { id, text, resolve });
        setC(r.entry);
        setText("");
        toast(/@/.test(contact) || c.data.customer_email ? "Sent — also emailed to the customer." : "Sent.");
      } else {
        const r = await put<{ entry: Entry }>("entry", { id, data: { ...c.data, status: "Resolved" } });
        setC(r.entry);
        toast("Marked as done.");
      }
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setBusy(false);
  };
  return (
    <div className="pb-44">
      <PageTitle
        title={String(c.data.name ?? "Customer")}
        sub={contact}
        back="#/chats"
        action={
          <div className="flex gap-2">
            {/^\d{10}$/.test(phone) && <Button small kind="secondary" href={`https://wa.me/91${phone}`}>💬 WhatsApp</Button>}
            {/^\d{10}$/.test(phone) && <Button small kind="secondary" href={`tel:+91${phone}`}>📞 Call</Button>}
          </div>
        }
      />
      <div className="flex flex-col gap-2">
        {msgs.map((m, i) => (
          <div key={i} className={cx("max-w-[85%] rounded-2xl px-3.5 py-2.5", m.from === "team" ? "self-end rounded-br-md bg-ak-800 text-white" : "self-start rounded-bl-md border border-line bg-white text-ink")}>
            {m.image && (
              <a href={m.image} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.image} alt="Photo from customer" className="mb-1 max-h-56 rounded-xl" />
              </a>
            )}
            {m.text && <p className="whitespace-pre-line text-[15px]">{m.text}</p>}
            <p className={cx("mt-0.5 text-[11.5px]", m.from === "team" ? "text-white/70" : "text-muted")}>{when(m.at)}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-line bg-white px-4 py-3 lg:bottom-0 lg:left-64">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex gap-1.5 overflow-x-auto">
            {["Thank you! 🙏", "Your order is on the way 🚚", "Please share your order number", "Sorry for the trouble — we're checking"].map((q) => (
              <button key={q} type="button" onClick={() => setText((t) => (t ? `${t} ${q}` : q))} className="shrink-0 rounded-full border border-line px-3 py-1 text-[13px] font-semibold text-ink">
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea className={cx(inputCls, "min-h-[48px] flex-1")} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your reply…" />
            <Button busy={busy} disabled={!text.trim()} onClick={() => send(false)}>Send</Button>
          </div>
          {c.data.status !== "Resolved" && (
            <button type="button" onClick={() => send(true)} className="mt-1.5 text-[13.5px] font-bold text-leaf">
              ✅ {text.trim() ? "Send & mark as done" : "Mark as done"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
