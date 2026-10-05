"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_STATUS, CONTACT, waLink } from "@/data/settings";
import { chatRef, communityReady, loadChat, sendChat, uploadMedia, type ChatMsg } from "@/lib/community";
import { getSession } from "@/lib/customer-account";
import { VerifiedBadge } from "./community";
import { Icon, I } from "./ui";

/* "Chat with AapkiKitab Team": a two-way chat kept in Shopify (Content → Metaobjects →
   Support chat). The team answers by typing in "Your reply"; it shows up here. */
const OPEN = "ak-open-chat";
const SEEN = "ak_chat_seen";
export const openChat = (detail: { topic?: string; order?: string } = {}) => {
  communityReady().then((ready) => {
    if (ready) window.dispatchEvent(new CustomEvent(OPEN, { detail }));
    else window.location.assign("/request-book"); // chat not switched on yet: the contact page still works
  });
};

const QUICK = ["Where is my order?", "Payment or refund issue", "Request a book", "Something else"];
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Ticks({ read }: { read: boolean }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" aria-label={read ? "Read" : "Sent"} className={read ? "text-ak-700" : "text-muted"}>
      <path d="M1 6l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {read && <path d="M6 9l1 0 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function ChatWidget() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [who, setWho] = useState({ name: "", contact: "", website: "" });
  const [needWho, setNeedWho] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    communityReady().then(setReady);
  }, []);

  const refresh = useCallback(async () => {
    if (!chatRef()) return;
    try {
      const m = await loadChat();
      setMsgs(m);
      const seen = localStorage.getItem(SEEN) ?? "";
      setUnread(m.filter((x) => x.from === "team" && x.at > seen).length);
    } catch {
      /* offline: keep what we have */
    }
  }, []);

  // poll: every 8 s while open, every minute in the background (for the unread badge)
  useEffect(() => {
    if (!ready) return;
    refresh();
    const id = window.setInterval(refresh, open ? 8000 : 60000);
    return () => window.clearInterval(id);
  }, [ready, open, refresh]);

  useEffect(() => {
    if (!open) return;
    const last = msgs[msgs.length - 1];
    if (last) localStorage.setItem(SEEN, last.at);
    setUnread(0);
    endRef.current?.scrollIntoView({ block: "end" });
  }, [open, msgs]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ topic?: string; order?: string }>).detail ?? {};
      if (d.topic || d.order) setText([d.topic, d.order ? `Order ${d.order}` : ""].filter(Boolean).join(" — ") + ": ");
      setOpen(true);
    };
    window.addEventListener(OPEN, onOpen);
    return () => window.removeEventListener(OPEN, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    setSignedIn(Boolean(getSession()));
    try {
      const p = JSON.parse(localStorage.getItem("ak_profile") ?? "null") as { name?: string; email?: string; mobile?: string } | null;
      if (p) setWho((w) => ({ ...w, name: w.name || p.name || "", contact: w.contact || p.mobile || p.email || "" }));
    } catch {
      /* nothing saved */
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!ready || pathname.startsWith("/account/callback") || (pathname.startsWith("/community/share") && !open)) return null;

  const send = async (body: { text: string; image?: string }) => {
    if (!chatRef() && (!who.name.trim() || !who.contact.trim())) {
      setNeedWho(true);
      return;
    }
    setBusy(true);
    setError("");
    const optimistic: ChatMsg = { from: "customer", text: body.text, image: body.image, at: new Date().toISOString() };
    setMsgs((m) => [...m, optimistic]);
    try {
      setMsgs(await sendChat({ ...body, ...(chatRef() ? {} : who) }));
      setText("");
      setNeedWho(false);
    } catch (e) {
      setMsgs((m) => m.filter((x) => x !== optimistic));
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const attach = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const r = await uploadMedia(file, true);
      await send({ text: text.trim(), image: r.url });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const lift = pathname.startsWith("/book/") ? "bottom-[150px]" : "bottom-[84px]";
  const lastTeamAt = [...msgs].reverse().find((m) => m.from === "team")?.at ?? "";
  const wa = waLink(`Hello AapkiKitab Team: ${text}`);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with AapkiKitab Team"
          className={`fixed right-4 z-40 flex h-[52px] items-center gap-2 rounded-full bg-ak-800 px-4 text-white shadow-[0_14px_30px_-12px_rgba(46,18,143,0.9)] transition-transform hover:scale-[1.03] lg:bottom-6 lg:right-6 ${lift}`}
        >
          <Icon size={22} d={I.chat} />
          <span className="hidden text-[14.5px] font-bold sm:inline">Chat with us</span>
          {unread > 0 && <span className="tnum absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[11px] font-bold ring-2 ring-white">{unread}</span>}
        </button>
      )}
      {open && (
        <div role="dialog" aria-label="Chat with AapkiKitab Team" className="ak-menu fixed inset-0 z-[55] flex flex-col bg-[#f7f4ff] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[86vh] sm:w-[400px] sm:overflow-hidden sm:rounded-3xl sm:shadow-[0_30px_70px_-25px_rgba(23,11,69,0.55)]">
          <div className="flex items-center gap-3 border-b border-line bg-white px-3 py-3 pt-[calc(12px+env(safe-area-inset-top))] sm:pt-3">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ak-50">
              <span className="rotate-180"><Icon size={20} d={I.arrow} /></span>
            </button>
            <span className="relative">
              <img src="/logo.webp" alt="" className="h-11 w-11 rounded-full" />
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white"><VerifiedBadge size={16} /></span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[16px] font-bold text-ink">Chat with AapkiKitab Team</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
                <span className="h-2 w-2 rounded-full bg-leaf" /> {CHAT_STATUS}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
            <div className="flex items-end gap-2">
              <img src="/logo.webp" alt="" className="h-8 w-8 rounded-full" />
              <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-sm">
                <p className="flex items-center gap-1 text-[12.5px] font-bold text-ak-900">AapkiKitab Team <VerifiedBadge size={13} /></p>
                <p className="mt-0.5 text-[14.5px] text-ink">Namaste 🙏 How can we help you today?</p>
              </div>
            </div>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-10">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => setText(`${q} `)} className="rounded-full border border-ak-100 bg-white px-3 py-1.5 text-[13px] font-semibold text-ak-900 hover:border-ak-800">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => {
              const showDay = i === 0 || day(msgs[i - 1].at) !== day(m.at);
              return (
                <div key={`${m.at}-${i}`}>
                  {showDay && <p className="my-2 text-center text-[11.5px] font-semibold text-muted">{day(m.at)}</p>}
                  {m.from === "customer" ? (
                    <div className="flex flex-col items-end">
                      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ak-800 px-3.5 py-2.5 text-white">
                        {m.image && <img src={m.image} alt="Photo you sent" className="mb-1.5 max-h-56 rounded-lg" />}
                        {m.text && <p className="whitespace-pre-line text-[14.5px]">{m.text}</p>}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                        {clock(m.at)} <Ticks read={Boolean(lastTeamAt && lastTeamAt > m.at)} />
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <img src="/logo.webp" alt="" className="h-8 w-8 rounded-full" />
                      <div className="max-w-[78%]">
                        <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 shadow-sm">
                          <p className="flex items-center gap-1 text-[12.5px] font-bold text-ak-900">AapkiKitab Team <VerifiedBadge size={13} /></p>
                          <p className="mt-0.5 whitespace-pre-line text-[14.5px] text-ink">{m.text}</p>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">{clock(m.at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {msgs.length > 0 && msgs[msgs.length - 1].from === "customer" && (
              <p className="text-center text-[12px] text-muted">Our team has your message and will reply here. You can close this and come back.</p>
            )}
            <div ref={endRef} />
          </div>

          {needWho && !chatRef() && (
            <div className="mx-3 mb-2 rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[13.5px] font-semibold text-ink">So we can reach you if you leave:</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} placeholder="Your name" autoComplete="name" className="h-10 min-w-0 rounded-xl border border-line px-3 text-[14px] outline-none focus:border-ak-800" />
                <input value={who.contact} onChange={(e) => setWho({ ...who, contact: e.target.value })} placeholder="Mobile or email" autoComplete="tel" className="h-10 min-w-0 rounded-xl border border-line px-3 text-[14px] outline-none focus:border-ak-800" />
              </div>
              <input value={who.website} onChange={(e) => setWho({ ...who, website: e.target.value })} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            </div>
          )}
          {error && <p role="alert" className="mx-4 mb-1 text-[13px] font-semibold text-rose">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) send({ text: text.trim() });
            }}
            className="flex items-center gap-2 border-t border-line bg-white px-3 py-2.5 pb-[calc(10px+env(safe-area-inset-bottom))]"
          >
            {signedIn && (
              <>
                <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a photo" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-ak-50 hover:text-ak-800">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" /></svg>
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ""; }} />
              </>
            )}
            <input value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))} placeholder="Type your message..." className="h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[15px] outline-none focus:border-ak-800" />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ak-800 text-white disabled:bg-ak-100">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6l-.1 6.5L15 12 3.3 13.9z" fill="currentColor" /></svg>
            </button>
          </form>
          {(CONTACT.whatsappNumber || CONTACT.phone) && (
            <p className="bg-white pb-2 text-center text-[12.5px] text-muted">
              {CONTACT.whatsappNumber && <a href={wa} target="_blank" rel="noreferrer" className="font-semibold text-[#128c4a]">WhatsApp us</a>}
              {CONTACT.whatsappNumber && CONTACT.phone && " · "}
              {CONTACT.phone && <a href={CONTACT.phoneHref} className="font-semibold text-ak-800">Call {CONTACT.phone}</a>}
            </p>
          )}
        </div>
      )}
    </>
  );
}
