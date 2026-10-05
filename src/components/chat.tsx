"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTACT, waLink } from "@/data/settings";
import { sendMessage } from "@/lib/community";
import { VerifiedBadge } from "./community";
import { Icon, I } from "./ui";

/* "Chat with AapkiKitab Team": messages land in Shopify admin (Content → Metaobjects →
   Customer message); WhatsApp is offered too when the shop has a number. */
const OPEN = "ak-open-chat";
export const openChat = (detail: { topic?: string; order?: string } = {}) => window.dispatchEvent(new CustomEvent(OPEN, { detail }));

const TOPICS = ["Order status", "Payment or refund", "Book request", "Something else"];

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [form, setForm] = useState({ name: "", contact: "", order: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ topic?: string; order?: string }>).detail ?? {};
      if (d.topic) setTopic(d.topic);
      if (d.order) setForm((f) => ({ ...f, order: d.order ?? "" }));
      setOpen(true);
    };
    window.addEventListener(OPEN, onOpen);
    return () => window.removeEventListener(OPEN, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    try {
      const p = JSON.parse(localStorage.getItem("ak_profile") ?? "null") as { name?: string; email?: string; mobile?: string } | null;
      if (p) setForm((f) => ({ ...f, name: f.name || p.name || "", contact: f.contact || p.mobile || p.email || "" }));
    } catch {
      /* nothing saved */
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/account/callback")) return null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const needsOrder = topic === "Order status" || topic === "Payment or refund";
  const wa = waLink(`Hello AapkiKitab Team${topic ? ` (${topic})` : ""}${form.order ? `, order ${form.order}` : ""}: ${form.message}`);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendMessage({ ...form, topic: topic || "Something else", page: pathname });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* sits above the bottom tab bar on phones, and above the sticky buy bar on product pages */
  const lift = pathname.startsWith("/book/") ? "bottom-[150px]" : "bottom-[84px]";

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
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Chat with AapkiKitab Team"
          className="ak-menu fixed inset-x-0 bottom-0 z-[55] flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-20px_50px_-20px_rgba(23,11,69,0.5)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:rounded-3xl"
        >
          <div className="flex items-center gap-3 bg-[linear-gradient(110deg,var(--color-ak-900),var(--color-ak-700))] px-4 py-3.5 text-white">
            <img src="/logo.webp" alt="" className="h-10 w-10 rounded-full bg-white/10" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="flex items-center gap-1.5 text-[15.5px] font-bold">
                AapkiKitab Team <span className="rounded-full bg-white p-px"><VerifiedBadge size={14} /></span>
              </p>
              <p className="text-[12.5px] text-white/80">We usually reply within a few hours</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
              <Icon size={20} d={I.x} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#faf8ff] px-4 py-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[14px] text-ink shadow-sm">
              Namaste 🙏 How can we help you today?
            </div>

            {sent ? (
              <div className="ml-auto mt-3 max-w-[85%] rounded-2xl rounded-tr-md bg-ak-800 px-3.5 py-2.5 text-[14px] text-white">
                Thanks, {form.name.split(" ")[0]}! Your message has reached our team. We&apos;ll reply on {form.contact} soon.
              </div>
            ) : (
              <form onSubmit={submit} className="mt-3 flex flex-col gap-2.5" noValidate>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      aria-pressed={topic === t}
                      className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${topic === t ? "bg-ak-800 text-white" : "border border-ak-100 bg-white text-ak-900 hover:border-ak-800"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" className="h-11 rounded-xl border border-line bg-white px-3.5 text-[14.5px] outline-none focus:border-ak-800" />
                <input value={form.contact} onChange={set("contact")} placeholder="Mobile number or email" autoComplete="tel" className="h-11 rounded-xl border border-line bg-white px-3.5 text-[14.5px] outline-none focus:border-ak-800" />
                {needsOrder && <input value={form.order} onChange={set("order")} placeholder="Order number (if you have it)" className="h-11 rounded-xl border border-line bg-white px-3.5 text-[14.5px] outline-none focus:border-ak-800" />}
                <textarea value={form.message} onChange={set("message")} rows={3} placeholder="Type your message…" className="resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14.5px] outline-none focus:border-ak-800" />
                <input value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                {error && <p role="alert" className="text-[13px] font-semibold text-rose">{error}</p>}
                <button type="submit" disabled={busy} className="h-11 rounded-xl bg-ak-800 text-[14.5px] font-bold text-white hover:bg-ak-900 disabled:opacity-70">
                  {busy ? "Sending…" : "Send message"}
                </button>
                {CONTACT.whatsappNumber && (
                  <a href={wa} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#25d366] text-[14px] font-bold text-[#128c4a]">
                    Prefer WhatsApp? Chat there
                  </a>
                )}
                {CONTACT.phone && (
                  <a href={CONTACT.phoneHref} className="text-center text-[13px] font-semibold text-ak-800">Or call {CONTACT.phone}</a>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
