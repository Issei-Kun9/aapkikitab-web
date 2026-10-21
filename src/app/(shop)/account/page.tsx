"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, I } from "@/components/ui";
import { CONTACT } from "@/data/settings";
import { openChat } from "@/components/chat";
import { ProfileLinks } from "@/components/profile-links";
import { fetchMe, fetchOrder, getSession, requestCode, saveProfile, signOut, verifyCode, type Address, type CustomerOrder, type Profile } from "@/lib/account";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const dateOf = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inputCls =
  "h-12 w-full rounded-lg border border-line bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-ak-800 focus:shadow-[0_0_0_4px_rgba(75,15,138,0.08)]";

/* One plain-language status per order */
function statusOf(o: CustomerOrder): { label: string; tone: "ok" | "wait" | "bad"; step: number } {
  if (o.status === "cancelled") return { label: "Cancelled", tone: "bad", step: -1 };
  if (o.payment_status === "refunded") return { label: "Refunded", tone: "bad", step: -1 };
  if (o.status === "delivered") return { label: "Delivered", tone: "ok", step: 3 };
  if (o.status === "shipped") return { label: "Shipped", tone: "ok", step: 2 };
  if (o.status === "packed") return { label: "Packed · shipping soon", tone: "ok", step: 1 };
  return { label: "Confirmed · being packed", tone: "ok", step: 0 };
}
const STEPS = ["Confirmed", "Packed", "Shipped", "Delivered"];
const TONE = { ok: "bg-leaf/10 text-leaf", wait: "bg-marigold-50 text-[#9a5b00]", bad: "bg-rose-50 text-rose" };

export function OrderCard({ o, open = false }: { o: CustomerOrder; open?: boolean }) {
  const st = statusOf(o);
  const [more, setMore] = useState(open);
  return (
    <li id={`order-${o.id}`} className="ak-card rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold text-ink">Order #{o.number}</p>
          <p className="text-[13px] text-muted">
            {dateOf(o.created_at)} · {inr(o.total)}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${TONE[st.tone]}`}>{st.label}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {o.items.map((li) => (
          <li key={li.id} className="flex items-center gap-2 rounded-lg bg-ak-50 p-1.5 pr-2.5" title={li.title}>
            {li.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={li.image} alt="" className="h-10 w-8 rounded object-cover" />
            ) : (
              <span className="grid h-10 w-8 place-items-center rounded bg-ak-100 text-xs font-bold text-ak-800">{li.title.charAt(0)}</span>
            )}
            <span className="max-w-[140px] truncate text-[12.5px] font-semibold text-ink">{li.title}</span>
            {li.qty > 1 && <span className="text-[12px] text-muted">×{li.qty}</span>}
          </li>
        ))}
      </ul>
      {st.step >= 0 && (
        <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Delivery progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col gap-1">
              <span className={`h-1.5 rounded-full ${i <= st.step ? "bg-ak-800" : "bg-line"}`} />
              <span className={`text-[11px] font-semibold ${i <= st.step ? "text-ak-800" : "text-muted"}`}>{s}</span>
            </li>
          ))}
        </ol>
      )}
      {(o.courier || o.tracking_number) && (
        <p className="mt-2 text-[13.5px] text-ink">
          🚚 {[o.courier, o.tracking_number].filter(Boolean).join(" · ")}
        </p>
      )}
      {o.refunded > 0 && <p className="mt-2 text-[13px] font-semibold text-ink">Refunded: {inr(o.refunded)} (reaches your account in 5–7 working days)</p>}
      {more && (
        <div className="mt-3 rounded-xl bg-paper p-3 text-[13.5px] text-ink">
          <ul className="flex flex-col gap-1">
            {o.items.map((li) => (
              <li key={li.id} className="flex justify-between gap-2">
                <span>
                  {li.title} × {li.qty}
                </span>
                <span>{inr(li.price * li.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-2 text-muted">
              <span>Delivery</span>
              <span>{o.shipping ? inr(o.shipping) : "FREE"}</span>
            </li>
            <li className="flex justify-between gap-2 font-bold">
              <span>Total paid</span>
              <span>{inr(o.total)}</span>
            </li>
          </ul>
          <p className="mt-2 text-muted">
            Delivering to {o.name}, {o.address.line}, {o.address.city}, {o.address.state} {o.address.pincode}
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setMore((m) => !m)} className="inline-flex h-10 items-center rounded-lg bg-ak-800 px-4 text-[13.5px] font-bold text-white hover:bg-ak-900">
          {more ? "Hide details" : "Order details"}
        </button>
        {o.tracking_url && (
          <a href={o.tracking_url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg border border-ak-800/30 px-4 text-[13.5px] font-bold text-ak-800 hover:border-ak-800">
            Track parcel{o.courier ? ` · ${o.courier}` : ""}
          </a>
        )}
        <button
          type="button"
          onClick={() => openChat({ topic: "Payment or refund", order: `#${o.number}` })}
          className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-[13.5px] font-bold text-ink hover:border-ak-800"
        >
          Need help with this order?
        </button>
      </div>
    </li>
  );
}

function SignInCard({ next }: { next: string }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dev, setDev] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_20px_50px_-30px_rgba(46,18,143,0.5)] sm:p-8">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ak-50 text-ak-800">
        <Icon size={28} d={I.user} />
      </span>
      {step === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await requestCode(email);
              if (r.devCode) setDev(r.devCode);
              setStep("code");
            });
          }}
        >
          <h2 className="mt-4 font-display text-[26px] font-bold text-ink">Sign in or create account</h2>
          <p className="mt-2 text-[15px] text-muted">Enter your email and we&apos;ll send you a 6-digit code. No password needed.</p>
          <label htmlFor="acc-email" className="sr-only">Email</label>
          <input id="acc-email" type="email" inputMode="email" autoComplete="email" required className={`${inputCls} mt-5`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button type="submit" disabled={busy} className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-ak-800 text-[15px] font-bold text-white transition-colors hover:bg-ak-900 disabled:opacity-70">
            {busy ? "Sending…" : "Send me a code"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await verifyCode(email, code);
              if (next && next.startsWith("/") && !next.startsWith("//") && next !== "/account") window.location.assign(next);
            });
          }}
        >
          <h2 className="mt-4 font-display text-[26px] font-bold text-ink">Check your email</h2>
          <p className="mt-2 text-[15px] text-muted">
            We sent a 6-digit code to <b className="text-ink">{email}</b>. It works for 10 minutes. (Check spam if you don&apos;t see it.)
          </p>
          {dev && <p className="mt-2 rounded-lg bg-marigold-50 p-2 text-[13px]">Test mode code: <b>{dev}</b></p>}
          <label htmlFor="acc-code" className="sr-only">Code</label>
          <input
            id="acc-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className={`${inputCls} mt-5 text-center text-[24px] tracking-[0.4em]`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
          />
          <button type="submit" disabled={busy || code.length < 6} className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-ak-800 text-[15px] font-bold text-white transition-colors hover:bg-ak-900 disabled:opacity-70">
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button type="button" onClick={() => setStep("email")} className="mt-3 text-[14px] font-bold text-ak-800">
            Use a different email
          </button>
        </form>
      )}
      {error && <p className="mt-3 text-[14px] font-semibold text-rose">{error}</p>}
      <ul className="mt-6 space-y-2 text-left text-[14px] text-ink">
        {["Track your orders and deliveries", "Faster checkout with saved address", "Help with payments and refunds"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <span className="text-leaf">
              <Icon size={17} d={I.check} />
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const emptyAddress = (p?: Partial<Profile>): Address => ({ id: "", name: p?.name ?? "", phone: p?.phone ?? "", line: "", city: "", state: "", pincode: "" });

function AddressForm({ a, onSave, onCancel }: { a: Address; onSave: (a: Address) => Promise<void>; onCancel: () => void }) {
  const [x, setX] = useState(a);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setX((v) => ({ ...v, [k]: e.target.value }));
  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
          await onSave(x);
        } catch (e2) {
          setErr((e2 as Error).message);
        }
        setBusy(false);
      }}
    >
      <input className={inputCls} placeholder="Full name" value={x.name} onChange={set("name")} required />
      <input className={inputCls} placeholder="10-digit mobile" inputMode="numeric" value={x.phone} onChange={set("phone")} required />
      <input className={inputCls} placeholder="House no, street, landmark" value={x.line} onChange={set("line")} required />
      <div className="grid grid-cols-3 gap-2">
        <input className={inputCls} placeholder="City" value={x.city} onChange={set("city")} required />
        <input className={inputCls} placeholder="State" value={x.state} onChange={set("state")} required />
        <input className={inputCls} placeholder="Pincode" inputMode="numeric" value={x.pincode} onChange={set("pincode")} required />
      </div>
      {err && <p className="text-[13.5px] font-semibold text-rose">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="h-11 flex-1 rounded-lg bg-ak-800 text-[14px] font-bold text-white disabled:opacity-60">
          {busy ? "Saving…" : "Save address"}
        </button>
        <button type="button" onClick={onCancel} className="h-11 rounded-lg border border-line px-4 text-[14px] font-bold text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

function SignedIn({ openOrder }: { openOrder: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchMe>> | undefined>(undefined);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Address | null>(null);
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);
  const load = useCallback(() => fetchMe().then(setData).catch((e: Error) => setError(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (openOrder && data) document.getElementById(`order-${openOrder}`)?.scrollIntoView({ block: "center" });
  }, [openOrder, data]);

  if (error)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center">
        <p className="text-[15px] text-ink">We couldn&apos;t load your account just now.</p>
        <p className="mt-1 text-[13px] text-muted">{error}</p>
        <button type="button" onClick={() => location.reload()} className="mt-4 rounded-lg bg-ak-800 px-4 py-2.5 text-[14px] font-bold text-white">
          Try again
        </button>
      </div>
    );
  if (data === undefined) return <p className="py-10 text-center text-muted">Loading your account…</p>;
  if (data === null) return null; // signed out elsewhere; the page shows the sign-in card

  const { customer, orders } = data;
  const saveAddresses = async (addresses: Address[]) => {
    await saveProfile({ addresses });
    setEditing(null);
    await load();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section id="orders">
        <h2 className="text-[20px] font-bold text-ink">My orders</h2>
        {orders.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-line bg-white p-6 text-center">
            <p className="text-[15px] text-ink">No orders yet.</p>
            <Link href="/browse" className="mt-3 inline-block rounded-lg bg-ak-800 px-5 py-2.5 text-[14px] font-bold text-white">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {orders.map((o) => (
              <OrderCard key={o.id} o={o} open={o.id === openOrder} />
            ))}
          </ul>
        )}
      </section>
      <aside className="flex flex-col gap-4">
        <div id="profile" className="ak-card rounded-2xl p-5">
          <p className="text-[13px] font-semibold text-muted">Signed in as</p>
          {profile ? (
            <form
              className="mt-2 flex flex-col gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await saveProfile(profile);
                  setProfile(null);
                  await load();
                } catch (e2) {
                  setError((e2 as Error).message);
                }
              }}
            >
              <input className={inputCls} placeholder="Your name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              <input className={inputCls} placeholder="10-digit mobile" inputMode="numeric" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              <div className="flex gap-2">
                <button type="submit" className="h-11 flex-1 rounded-lg bg-ak-800 text-[14px] font-bold text-white">Save</button>
                <button type="button" onClick={() => setProfile(null)} className="h-11 rounded-lg border border-line px-4 text-[14px] font-bold">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <p className="mt-0.5 text-[17px] font-bold text-ink">{customer.name || customer.email.split("@")[0]}</p>
              <p className="text-[14px] text-muted">{customer.email}</p>
              {customer.phone && <p className="text-[14px] text-muted">{customer.phone}</p>}
              <button type="button" onClick={() => setProfile({ name: customer.name, phone: customer.phone ?? "" })} className="mt-3 text-[14px] font-bold text-ak-800 hover:underline">
                Edit profile
              </button>
            </>
          )}
        </div>
        <div id="addresses" className="ak-card rounded-2xl p-5">
          <p className="text-[15px] font-bold text-ink">Saved addresses</p>
          {customer.addresses.length === 0 && !editing && <p className="mt-1 text-[14px] text-muted">No address saved yet. It&apos;s also saved when you check out.</p>}
          <ul className="mt-2 space-y-3">
            {customer.addresses.map((a) =>
              editing?.id === a.id ? (
                <li key={a.id}>
                  <AddressForm a={a} onCancel={() => setEditing(null)} onSave={(x) => saveAddresses(customer.addresses.map((y) => (y.id === a.id ? x : y)))} />
                </li>
              ) : (
                <li key={a.id} className="text-[14px] leading-snug text-ink">
                  {a.default && <span className="mb-1 inline-block rounded bg-ak-50 px-1.5 text-[11px] font-bold text-ak-800">Default</span>}
                  <span className="block font-semibold">{a.name} · {a.phone}</span>
                  <span className="block">{a.line}</span>
                  <span className="block">{a.city}, {a.state} {a.pincode}</span>
                  <span className="mt-1 flex gap-3 text-[13px] font-bold">
                    <button type="button" className="text-ak-800" onClick={() => setEditing(a)}>Edit</button>
                    {!a.default && <button type="button" className="text-ak-800" onClick={() => saveAddresses(customer.addresses.map((y) => ({ ...y, default: y.id === a.id })))}>Make default</button>}
                    <button type="button" className="text-rose" onClick={() => saveAddresses(customer.addresses.filter((y) => y.id !== a.id))}>Remove</button>
                  </span>
                </li>
              ),
            )}
          </ul>
          {editing && !editing.id ? (
            <AddressForm a={editing} onCancel={() => setEditing(null)} onSave={(x) => saveAddresses([...customer.addresses, { ...x, default: customer.addresses.length === 0 }])} />
          ) : (
            customer.addresses.length < 10 && (
              <button type="button" onClick={() => setEditing(emptyAddress(customer))} className="mt-3 text-[14px] font-bold text-ak-800 hover:underline">
                ＋ Add an address
              </button>
            )
          )}
        </div>
        <div className="ak-card flex flex-col gap-2 rounded-2xl p-5">
          <Link href="/wishlist" className="flex items-center gap-2 text-[14.5px] font-semibold text-ink hover:text-ak-800">
            <Icon size={18} d={I.heart()} />
            Wishlist
          </Link>
          <button type="button" onClick={() => openChat()} className="flex items-center gap-2 text-left text-[14.5px] font-semibold text-ink hover:text-ak-800">
            <Icon size={18} d={I.chat} />
            Chat with AapkiKitab Team{CONTACT.phone ? ` · ${CONTACT.phone}` : ""}
          </button>
          <button type="button" onClick={() => signOut()} className="mt-2 h-11 rounded-lg border border-line text-[14px] font-bold text-ink hover:border-ak-800">
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

/* Straight after paying: show the order even before the customer signs in. */
function JustOrdered({ id }: { id: string }) {
  const [o, setO] = useState<CustomerOrder | null>(null);
  useEffect(() => {
    fetchOrder(id).then(setO).catch(() => setO(null));
  }, [id]);
  if (!o) return null;
  return (
    <div className="mb-6">
      <div className="mb-3 rounded-2xl bg-leaf/10 p-4 text-ink">
        <p className="text-[17px] font-bold">🎉 Thank you! Your order #{o.number} is confirmed.</p>
        <p className="text-[14px] text-muted">We&apos;ll pack it within 24–48 hours and email you the tracking details. Sign in with the same email to see all your orders.</p>
      </div>
      <ul>
        <OrderCard o={o} open />
      </ul>
    </div>
  );
}

function AccountInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const order = params.get("order") ?? "";
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const sync = useCallback(() => setSignedIn(Boolean(getSession())), []);
  useEffect(() => {
    sync();
    window.addEventListener("ak-session", sync);
    return () => window.removeEventListener("ak-session", sync);
  }, [sync]);
  return (
    <div className="py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">My Account</h1>
      <div className="ak-card mt-4 rounded-2xl p-2 sm:p-3">
        <ProfileLinks />
      </div>
      <div className="mt-5">
        {order && !signedIn && <JustOrdered id={order} />}
        {signedIn === null ? null : signedIn ? <SignedIn openOrder={order} /> : <SignInCard next={next} />}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}
