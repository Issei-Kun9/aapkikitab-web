"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, EXAMS } from "@/data/taxonomy";
import { CONTACT, HEADER, SHIPPING } from "@/data/settings";
import { Icon, I } from "./ui";

/* ---------- delivery pincode: remembered on this device ---------- */
const DEFAULT_PLACE = HEADER.deliveryPlace;

export function DeliveryBar({ inline = false }: { inline?: boolean }) {
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [editing, setEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ak_pincode");
      if (saved) setPlace(saved);
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin.trim())) {
      setError(true);
      return;
    }
    const v = pin.trim();
    setPlace(v);
    try {
      localStorage.setItem("ak_pincode", v);
    } catch {
      /* ignore */
    }
    setEditing(false);
    setError(false);
  };

  const picker = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setEditing((o) => !o)}
        aria-expanded={editing}
        className="flex items-center gap-1.5 text-[14.5px] text-ink"
      >
        <span className="text-ak-800 [&_path]:fill-current [&_circle]:fill-white">
          <Icon size={22} d={I.pin} />
        </span>
        <span>
          Deliver to <span className="font-semibold">{place}</span>
        </span>
        <span className={`transition-transform ${editing ? "rotate-180" : ""}`}><Icon size={16} d={I.chevron} /></span>
      </button>
      {editing && (
        <form onSubmit={save} className="ak-menu absolute left-0 top-full z-50 mt-2 w-[260px] rounded-2xl border border-line bg-white p-4 shadow-[0_24px_48px_-24px_rgba(23,11,69,0.4)]" noValidate>
          <label htmlFor="ak-pin" className="text-[13px] font-bold text-ink">Enter your pincode</label>
          <div className="mt-2 flex gap-2">
            <input
              id="ak-pin"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 313001"
              aria-invalid={error || undefined}
              className="tnum h-10 w-full rounded-lg border border-line px-3 text-[15px] outline-none focus:border-ak-800"
            />
            <button type="submit" className="h-10 shrink-0 rounded-lg bg-ak-800 px-4 text-[14px] font-bold text-white hover:bg-ak-900">Apply</button>
          </div>
          {error && <p role="alert" className="mt-1.5 text-[12px] font-semibold text-rose">Enter a valid 6-digit pincode.</p>}
        </form>
      )}
    </div>
  );

  if (inline) return picker;

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pb-1 pt-1">
      {picker}
      <span className="flex shrink-0 items-center gap-2 text-ak-900">
        <Icon size={26} d={I.truck} />
        <span className="leading-tight">
          <span className="block text-[13.5px] font-semibold text-ink">Free Delivery</span>
          <span className="block text-[12px] text-muted">Above ₹{SHIPPING.freeAbove}</span>
        </span>
      </span>
    </div>
  );
}

/* ---------- voice search (Web Speech API where the browser has it) ---------- */
type Recognizer = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceButton({ onResult, onUnsupported }: { onResult: (text: string) => void; onUnsupported: () => void }) {
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognizer | null>(null);

  const start = () => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognizer; webkitSpeechRecognition?: new () => Recognizer };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      onUnsupported();
      return;
    }
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = false;
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) onResult(text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  return (
    <button
      type="button"
      onClick={start}
      aria-label={listening ? "Stop voice search" : "Search by voice"}
      aria-pressed={listening}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${listening ? "animate-pulse bg-ak-800 text-white" : "text-ak-800 hover:bg-ak-50"}`}
    >
      <Icon size={22} d={I.mic} />
    </button>
  );
}

/* ---------- side drawer for phones ---------- */
export function Drawer({ nav, onClose }: { nav: { label: string; href: string }[]; onClose: () => void }) {
  const pathname = usePathname();
  const first = useRef(pathname);
  useEffect(() => {
    if (pathname !== first.current) onClose();
  }, [pathname, onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  /* fixed entry points around the admin-managed header links, without repeats */
  const links = [
    { label: "Home", href: "/" },
    { label: "Browse books", href: "/browse" },
    { label: "Education & exams", href: "/category/education-exams" },
    ...nav,
    { label: "Find my book", href: "/find-my-book" },
    { label: "My account", href: "/account" },
  ].filter((l, i, all) => all.findIndex((x) => x.href === l.href) === i);
  const linkCls = (href: string) =>
    `block rounded-xl px-3 py-2.5 text-[15.5px] font-semibold transition-colors ${pathname === href ? "bg-ak-50 text-ak-800" : "text-ink hover:bg-ak-50"}`;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" aria-label="Close menu" onClick={onClose} className="ak-fade absolute inset-0 bg-ak-950/50" />
      <div className="ak-drawer absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col overflow-y-auto bg-white pb-8">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2">
            <img src="/logo.webp" alt="" width={36} height={36} className="h-9 w-9" />
            <span className="text-[20px] font-bold text-ak-900">AapkiKitab</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ak-50">
            <Icon size={22} d={I.x} />
          </button>
        </div>
        <nav aria-label="Menu" className="px-2">
          {links.map((n) => (
            <Link key={n.href + n.label} href={n.href} className={linkCls(n.href)}>{n.label}</Link>
          ))}
        </nav>
        <p className="mb-1 mt-5 px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Categories</p>
        <nav aria-label="Categories" className="px-2">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={c.href} className={linkCls(c.href)}>{c.label}</Link>
          ))}
        </nav>
        <p className="mb-1 mt-5 px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Exams</p>
        <div className="flex flex-wrap gap-2 px-4">
          {EXAMS.map((e) => (
            <Link key={e.slug} href={e.href} className="rounded-full border border-line px-3 py-1.5 text-[13.5px] font-semibold text-ink hover:border-ak-800 hover:text-ak-800">
              {e.label}
            </Link>
          ))}
        </div>
        <Link href="/request-book" className="mx-4 mt-6 flex items-center justify-center gap-2 rounded-xl bg-ak-800 py-3 text-[15px] font-bold text-white">
          <Icon size={18} d={I.headset} />
          Need help? Contact us
        </Link>
        {CONTACT.phone && (
          <a href={CONTACT.phoneHref} className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl border border-line py-3 text-[15px] font-bold text-ak-800">
            <Icon size={18} d={I.phone} />
            {CONTACT.phone}
          </a>
        )}
      </div>
    </div>
  );
}
