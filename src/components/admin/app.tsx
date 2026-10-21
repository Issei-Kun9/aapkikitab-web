"use client";
/* The AapkiKitab admin panel (aapkikitab.in/admin). One page; screens are switched with #/… links. */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, inr, post, type Setup } from "./api";
import { EntryEditor, EntryList, WebsiteHome } from "./content";
import { OrderDetail, OrderList } from "./orders";
import { ChatThread, Chats, Reviews } from "./community";
import { Button, Card, cx, inputCls, PageTitle, Spinner, ToastProvider, useToast } from "./ui";

interface Me {
  who: string | null;
  setup: Setup;
}
interface Dash {
  toPack: number;
  toShip: number;
  todayOrders: number;
  todaySales: number;
  pendingReviews: number;
  pendingComments: number;
  newChats: number;
  newMessages: number;
  lowStock: number;
}

function useHash() {
  // the admin page only renders after sign-in is checked in the browser, so location is there
  const [hash, setHash] = useState(() => (typeof window === "undefined" ? "" : location.hash));
  useEffect(() => {
    let last = location.hash;
    const on = () => {
      // leaving an editor with unsaved changes? ask first
      if ((window as unknown as { akDirty?: boolean }).akDirty && !confirm("You have changes that aren't saved. Leave without saving?")) {
        history.replaceState(null, "", last);
        return;
      }
      last = location.hash;
      setHash(last);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <Gate />
    </ToastProvider>
  );
}

function Gate() {
  const [me, setMe] = useState<Me | null>(null);
  const load = useCallback(() => api<Me>("me").then(setMe).catch(() => setMe({ who: null, setup: {} as Setup })), []);
  useEffect(() => {
    load();
    const out = () => setMe((m) => (m ? { ...m, who: null } : m));
    window.addEventListener("ak-admin-signed-out", out);
    return () => window.removeEventListener("ak-admin-signed-out", out);
  }, [load]);
  if (!me) return <div className="grid min-h-screen place-items-center text-muted"><Spinner /></div>;
  if (!me.who) return <Login setup={me.setup} onIn={load} />;
  return <Shell me={me} />;
}

function Login({ setup, onIn }: { setup: Setup; onIn: () => void }) {
  const [step, setStep] = useState<"email" | "code" | "password">(setup.emailLogin === false && setup.password ? "password" : "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dev, setDev] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };
  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#ece5ff,#faf8ff)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="" className="h-12 w-12" />
          <div>
            <p className="font-display text-[22px] font-bold text-ink">AapkiKitab</p>
            <p className="text-[14px] font-semibold text-ak-800">Shop admin</p>
          </div>
        </div>
        <Card className="p-5">
          {step === "email" && (
            <form onSubmit={(e) => (e.preventDefault(), run(async () => {
              const r = await post<{ devCode?: string }>("login/code", { email });
              if (r.devCode) setDev(r.devCode);
              setStep("code");
            }))}>
              <h1 className="text-[20px] font-bold text-ink">Sign in</h1>
              <p className="mb-4 mt-1 text-[14.5px] text-muted">Enter your email. We&apos;ll send you a 6-digit code.</p>
              <input className={inputCls} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              <Button type="submit" busy={busy} className="mt-3 w-full">Send me a code</Button>
              {setup.password && <button type="button" onClick={() => setStep("password")} className="mt-3 w-full text-[14px] font-semibold text-ak-800">Use the password instead</button>}
            </form>
          )}
          {step === "code" && (
            <form onSubmit={(e) => (e.preventDefault(), run(async () => {
              await post("login/verify", { email, code });
              onIn();
            }))}>
              <h1 className="text-[20px] font-bold text-ink">Check your email</h1>
              <p className="mb-4 mt-1 text-[14.5px] text-muted">We sent a code to <b className="text-ink">{email}</b>. It works for 10 minutes.</p>
              {dev && <p className="mb-2 rounded-lg bg-marigold-50 p-2 text-[13px]">Test mode code: <b>{dev}</b></p>}
              <input className={cx(inputCls, "text-center text-[24px] tracking-[0.4em]")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" required />
              <Button type="submit" busy={busy} className="mt-3 w-full">Sign in</Button>
              <button type="button" onClick={() => setStep("email")} className="mt-3 w-full text-[14px] font-semibold text-ak-800">Use a different email</button>
            </form>
          )}
          {step === "password" && (
            <form onSubmit={(e) => (e.preventDefault(), run(async () => {
              await post("login/password", { password });
              onIn();
            }))}>
              <h1 className="text-[20px] font-bold text-ink">Sign in</h1>
              <p className="mb-4 mt-1 text-[14.5px] text-muted">Enter the admin password.</p>
              <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" busy={busy} className="mt-3 w-full">Sign in</Button>
              {setup.emailLogin && <button type="button" onClick={() => setStep("email")} className="mt-3 w-full text-[14px] font-semibold text-ak-800">Email me a code instead</button>}
            </form>
          )}
          {err && <p className="mt-3 text-[14px] font-semibold text-rose">{err}</p>}
        </Card>
        <p className="mt-4 text-center text-[13px] text-muted"><Link href="/" className="underline">← Back to the shop</Link></p>
      </div>
    </div>
  );
}

const NAV = [
  { key: "", label: "Home", emoji: "🏠" },
  { key: "orders", label: "Orders", emoji: "📦" },
  { key: "content/product", label: "Products", emoji: "📚" },
  { key: "website", label: "Website", emoji: "🖼️" },
  { key: "reviews", label: "Reviews", emoji: "⭐" },
  { key: "chats", label: "Chats", emoji: "💬" },
  { key: "settings", label: "Settings", emoji: "⚙️" },
];
// the phone bottom bar has room for five
const PHONE_NAV = ["", "orders", "content/product", "chats", "more"];

function Shell({ me }: { me: Me }) {
  const parts = useHash();
  const [dash, setDash] = useState<Dash | null>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const load = () => api<Dash>("dashboard").then(setDash).catch(() => null);
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [parts.join("/")]); // refresh counts when moving around
  const at = parts.join("/");
  const active = (key: string) => (key === "" ? at === "" : at === key || at.startsWith(`${key}/`) || (key === "website" && at.startsWith("content/") && !at.startsWith("content/product")));
  const badge = (key: string) => (key === "orders" ? dash?.toPack : key === "reviews" ? (dash ? dash.pendingReviews + dash.pendingComments : 0) : key === "chats" ? dash?.newChats : 0) || 0;

  let screen: React.ReactNode;
  const [a, b, c] = parts;
  if (!a) screen = <Home dash={dash} setup={me.setup} />;
  else if (a === "orders") screen = b ? <OrderDetail id={b} /> : <OrderList />;
  else if (a === "website") screen = <WebsiteHome />;
  else if (a === "content" && b) screen = c ? <EntryEditor key={`${b}/${c}`} type={b} id={c} /> : <EntryList key={b} type={b} />;
  else if (a === "reviews") screen = <Reviews />;
  else if (a === "chats") screen = b ? <ChatThread id={b} /> : <Chats />;
  else if (a === "settings") screen = <Settings me={me} />;
  else screen = <Home dash={dash} setup={me.setup} />;

  return (
    <div className="min-h-screen bg-paper">
      {/* computer: sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white p-4 lg:flex print:hidden">
        <a href="#/" className="mb-6 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="" className="h-10 w-10" />
          <span>
            <span className="block font-display text-[18px] font-bold text-ink">AapkiKitab</span>
            <span className="block text-[12.5px] font-semibold text-ak-800">Shop admin</span>
          </span>
        </a>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <a key={n.key} href={`#/${n.key}`} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15.5px] font-semibold", active(n.key) ? "bg-ak-800 text-white" : "text-ink hover:bg-ak-50")}>
              <span className="text-[19px]">{n.emoji}</span>
              {n.label}
              {badge(n.key) > 0 && <span className={cx("ml-auto rounded-full px-2 text-[12.5px] font-bold", active(n.key) ? "bg-white text-ak-800" : "bg-rose text-white")}>{badge(n.key)}</span>}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 text-[14px]">
          <a href="/" target="_blank" rel="noreferrer" className="font-semibold text-ak-800">🌐 Open the website</a>
          <button type="button" onClick={() => post("logout", {}).finally(() => location.reload())} className="text-left font-semibold text-muted">Sign out</button>
        </div>
      </aside>

      {/* phone: top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden print:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="" className="h-8 w-8" />
        <span className="font-display text-[17px] font-bold text-ink">Shop admin</span>
        <a href="/" target="_blank" rel="noreferrer" className="ml-auto rounded-full border border-line px-3 py-1 text-[13px] font-bold text-ak-800">🌐 Website</a>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 lg:ml-64 lg:px-8 lg:py-8 print:hidden">{screen}</main>

      {/* phone: bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 border-t border-line bg-white lg:hidden print:hidden">
        {PHONE_NAV.map((key) => {
          const n = key === "more" ? { key, label: "More", emoji: "☰" } : NAV.find((x) => x.key === key)!;
          const isOn = key === "more" ? more : active(key);
          return key === "more" ? (
            <button key={key} type="button" onClick={() => setMore((m) => !m)} className={cx("relative flex flex-col items-center justify-center text-[12px] font-bold", isOn ? "text-ak-800" : "text-muted")}>
              <span className="text-[20px] leading-none">{n.emoji}</span>
              {n.label}
              {badge("reviews") > 0 && <span className="absolute right-4 top-2 h-2.5 w-2.5 rounded-full bg-rose" />}
            </button>
          ) : (
            <a key={key} href={`#/${key}`} onClick={() => setMore(false)} className={cx("relative flex flex-col items-center justify-center text-[12px] font-bold", isOn ? "text-ak-800" : "text-muted")}>
              <span className="text-[20px] leading-none">{n.emoji}</span>
              {n.label}
              {badge(key) > 0 && <span className="absolute right-3 top-1.5 min-w-5 rounded-full bg-rose px-1.5 text-[11px] text-white">{badge(key)}</span>}
            </a>
          );
        })}
      </nav>
      {more && (
        <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-line bg-white p-3 shadow-[0_-8px_24px_rgba(23,18,46,0.08)] lg:hidden">
          {NAV.filter((n) => !PHONE_NAV.includes(n.key)).map((n) => (
            <a key={n.key} href={`#/${n.key}`} onClick={() => setMore(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[16px] font-semibold text-ink hover:bg-ak-50">
              <span className="text-[20px]">{n.emoji}</span>
              {n.label}
              {badge(n.key) > 0 && <span className="ml-auto rounded-full bg-rose px-2 text-[12.5px] font-bold text-white">{badge(n.key)}</span>}
            </a>
          ))}
          <button type="button" onClick={() => post("logout", {}).finally(() => location.reload())} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[16px] font-semibold text-muted">
            <span className="text-[20px]">🚪</span>Sign out
          </button>
        </div>
      )}
      <div className="h-[68px] lg:hidden" />
    </div>
  );
}

function Home({ dash, setup }: { dash: Dash | null; setup: Setup }) {
  const missing = [
    !setup.database && "the database",
    !setup.storage && "photo storage",
    !setup.payments && "Razorpay payments",
    !setup.email && "emails",
  ].filter(Boolean) as string[];
  const todo = dash
    ? [
        { n: dash.toPack, emoji: "📦", text: ["order to pack", "orders to pack"], href: "#/orders" },
        { n: dash.toShip, emoji: "🎁", text: ["order packed — ready to ship", "orders packed — ready to ship"], href: "#/orders" },
        { n: dash.newChats, emoji: "💬", text: ["chat waiting for a reply", "chats waiting for a reply"], href: "#/chats" },
        { n: dash.pendingReviews + dash.pendingComments, emoji: "⭐", text: ["review or comment to approve", "reviews / comments to approve"], href: "#/reviews" },
        { n: dash.newMessages, emoji: "🚩", text: ["reported review", "reported reviews"], href: "#/content/ak_message" },
        { n: dash.lowStock, emoji: "⚠️", text: ["product almost sold out", "products almost sold out"], href: "#/content/product" },
      ].filter((t) => t.n > 0)
    : [];
  const hour = new Date().getHours();
  return (
    <div>
      <PageTitle title={`${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"} 👋`} sub="Here's what needs you today." />
      {missing.length > 0 && (
        <Card className="mb-3 border-marigold/40 bg-marigold-50">
          <p className="text-[15px] font-bold text-ink">⚙️ Setup not finished: {missing.join(", ")}</p>
          <p className="text-[14px] text-muted">Ask your website helper to finish setup. See Settings for details.</p>
        </Card>
      )}
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <Card>
          <p className="text-[13.5px] font-semibold text-muted">Today&apos;s orders</p>
          <p className="text-[26px] font-bold text-ink">{dash ? dash.todayOrders : "…"}</p>
        </Card>
        <Card>
          <p className="text-[13.5px] font-semibold text-muted">Today&apos;s sales</p>
          <p className="text-[26px] font-bold text-ink">{dash ? inr(dash.todaySales) : "…"}</p>
        </Card>
      </div>
      <h2 className="mb-2 text-[17px] font-bold text-ink">To do</h2>
      {!dash ? (
        <p className="text-muted"><Spinner /> Loading…</p>
      ) : !todo.length ? (
        <Card className="text-center">
          <p className="text-[34px]">🎉</p>
          <p className="text-[16px] font-bold text-ink">All done! Nothing needs you right now.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {todo.map((t) => (
            <a key={t.text[1]} href={t.href} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:border-ak-600">
              <span className="text-[24px]">{t.emoji}</span>
              <span className="text-[16px] text-ink"><b>{t.n}</b> {t.n === 1 ? t.text[0] : t.text[1]}</span>
              <span className="ml-auto text-[20px] text-muted">›</span>
            </a>
          ))}
        </div>
      )}
      <h2 className="mb-2 mt-6 text-[17px] font-bold text-ink">Quick actions</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { emoji: "➕", text: "Add a product", href: "#/content/product/new" },
          { emoji: "🏠", text: "Edit homepage", href: "#/content/ak_homepage" },
          { emoji: "🚚", text: "Delivery & contact", href: "#/content/ak_shop_info" },
          { emoji: "🏷️", text: "Categories & moods", href: "#/content/ak_tile" },
        ].map((q) => (
          <a key={q.text} href={q.href} className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-white p-4 text-center text-[14px] font-bold text-ink hover:border-ak-600">
            <span className="text-[26px]">{q.emoji}</span>
            {q.text}
          </a>
        ))}
      </div>
      <PublishCard setup={setup} />
    </div>
  );
}

function PublishCard({ setup }: { setup: Setup }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <Card className="mt-6">
      <p className="text-[15px] font-bold text-ink">🌐 When do my changes show on the website?</p>
      <p className="mt-1 text-[14px] text-muted">Products, homepage and menus update by themselves within 15 minutes. Reviews and chat replies show within a minute.</p>
      {setup.publishNow && (
        <Button small kind="secondary" className="mt-3" busy={busy} onClick={async () => {
          setBusy(true);
          await post<{ message: string }>("publish", {}).then((r) => toast(r.message)).catch((e) => toast(e.message, "error"));
          setBusy(false);
        }}>
          🚀 Publish now
        </Button>
      )}
    </Card>
  );
}

function Settings({ me }: { me: Me }) {
  const s = me.setup;
  const toast = useToast();
  const rows: [boolean, string, string][] = [
    [s.database, "Database", "Stores products, orders, reviews and chats."],
    [s.storage, "Photo & video storage", "Product photos and review photos/videos."],
    [s.payments, "Razorpay payments", "Customers pay by UPI, cards and net banking."],
    [s.webhook, "Razorpay backup confirmation", "Confirms payments even if a customer closes the page too early."],
    [s.email, "Emails", "Sign-in codes, order confirmations, shipping updates and alerts to you."],
    [s.emailLogin, "Admin sign-in by email code", "Who can open this admin panel."],
  ];
  return (
    <div>
      <PageTitle title="Settings" sub={`Signed in as ${me.who === "owner" ? "the shop owner (password)" : me.who}.`} />
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { emoji: "🚚", text: "Delivery, payment & contact details", href: "#/content/ak_shop_info" },
          { emoji: "📜", text: "Policy pages (shipping, returns, privacy, terms)", href: "#/content/policy" },
          { emoji: "🚩", text: "Reported reviews & messages", href: "#/content/ak_message" },
          { emoji: "🧭", text: "Menu links", href: "#/content/ak_link" },
        ].map((q) => (
          <a key={q.href} href={q.href} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:border-ak-600">
            <span className="text-[22px]">{q.emoji}</span>
            <span className="text-[15px] font-semibold text-ink">{q.text}</span>
            <span className="ml-auto text-[20px] text-muted">›</span>
          </a>
        ))}
      </div>
      <h2 className="mb-2 mt-6 text-[17px] font-bold text-ink">Setup check</h2>
      <Card>
        <ul className="flex flex-col gap-3">
          {rows.map(([ok, name, text]) => (
            <li key={name} className="flex gap-3">
              <span className="text-[20px]">{ok ? "✅" : "⚠️"}</span>
              <span>
                <span className="block text-[15px] font-bold text-ink">{name}</span>
                <span className="text-[13.5px] text-muted">{ok ? text : `Not set up yet — ${text.toLowerCase()}`}</span>
              </span>
            </li>
          ))}
        </ul>
        {s.email && (
          <Button small kind="secondary" className="mt-4" onClick={() => post<{ to: string }>("test-email", {}).then((r) => toast(`Test email sent to ${r.to}.`)).catch((e) => toast(e.message, "error"))}>
            ✉️ Send me a test email
          </Button>
        )}
      </Card>
      {s.dev && <p className="mt-4 text-[13px] font-bold text-[#9a5b00]">Test mode is on (no real payments or emails).</p>}
    </div>
  );
}
