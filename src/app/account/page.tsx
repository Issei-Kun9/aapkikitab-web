"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon, I } from "@/components/ui";
import { ACCOUNT_URL, CONTACT } from "@/data/settings";
import { openChat } from "@/components/chat";
import { ProfileLinks } from "@/components/profile-links";
import {
  ACCOUNT_QUERY,
  customerQuery,
  getSession,
  onSiteAccounts,
  signIn,
  signOut,
  type AccountCustomer,
  type AccountOrder,
} from "@/lib/customer-account";

const inrOf = (m: { amount: string }) => `₹${Math.round(parseFloat(m.amount)).toLocaleString("en-IN")}`;
const dateOf = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* One plain-language status per order, from Shopify's payment + delivery state. */
function statusOf(o: AccountOrder): { label: string; tone: "ok" | "wait" | "bad"; step: number } {
  const ship = o.fulfillments.nodes[0]?.latestShipmentStatus;
  if (o.cancelledAt) return { label: "Cancelled", tone: "bad", step: -1 };
  if (o.financialStatus === "REFUNDED") return { label: "Refunded", tone: "bad", step: -1 };
  if (o.financialStatus === "PARTIALLY_REFUNDED") return { label: "Partly refunded", tone: "wait", step: -1 };
  if (ship === "DELIVERED") return { label: "Delivered", tone: "ok", step: 3 };
  if (ship === "OUT_FOR_DELIVERY") return { label: "Out for delivery", tone: "ok", step: 2 };
  if (ship === "FAILURE" || ship === "ATTEMPTED_DELIVERY") return { label: "Delivery attempt failed", tone: "bad", step: 2 };
  if (o.fulfillmentStatus === "FULFILLED" || o.fulfillmentStatus === "PARTIALLY_FULFILLED" || ship) return { label: "Shipped", tone: "ok", step: 2 };
  if (o.financialStatus === "PENDING" || o.financialStatus === "AUTHORIZED") return { label: "Payment pending", tone: "wait", step: 0 };
  return { label: "Confirmed · being packed", tone: "ok", step: 1 };
}
const STEPS = ["Placed", "Packed", "Shipped", "Delivered"];
const TONE = { ok: "bg-leaf/10 text-leaf", wait: "bg-marigold-50 text-[#9a5b00]", bad: "bg-rose-50 text-rose" };


function OrderCard({ o }: { o: AccountOrder }) {
  const st = statusOf(o);
  const track = o.fulfillments.nodes.flatMap((f) => f.trackingInformation).find((t) => t.url || t.number);
  const eta = o.fulfillments.nodes[0]?.estimatedDeliveryAt;
  const refunded = parseFloat(o.totalRefunded.amount) > 0;
  return (
    <li className="ak-card rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold text-ink">Order {o.name}</p>
          <p className="text-[13px] text-muted">{dateOf(o.processedAt)} · {inrOf(o.totalPrice)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold ${TONE[st.tone]}`}>{st.label}</span>
      </div>
      <ul className="mt-3 flex gap-2">
        {o.lineItems.nodes.map((li, i) => (
          <li key={i} className="flex items-center gap-2 rounded-lg bg-ak-50 p-1.5 pr-2.5" title={li.title}>
            {li.image?.url ? (
              <img src={li.image.url} alt="" className="h-10 w-8 rounded object-cover" />
            ) : (
              <span className="grid h-10 w-8 place-items-center rounded bg-ak-100 text-xs font-bold text-ak-800">{li.title.charAt(0)}</span>
            )}
            <span className="max-w-[110px] truncate text-[12.5px] font-semibold text-ink">{li.title}</span>
            {li.quantity > 1 && <span className="text-[12px] text-muted">×{li.quantity}</span>}
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
      {eta && st.step < 3 && st.step >= 0 && <p className="mt-2 text-[13px] text-ink">Expected by {dateOf(eta)}</p>}
      {refunded && <p className="mt-2 text-[13px] font-semibold text-ink">Refunded: {inrOf(o.totalRefunded)} (reaches your account in 5–7 working days)</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={o.statusPageUrl} className="inline-flex h-10 items-center rounded-lg bg-ak-800 px-4 text-[13.5px] font-bold text-white hover:bg-ak-900">
          Order details
        </a>
        {track?.url && (
          <a href={track.url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg border border-ak-800/30 px-4 text-[13.5px] font-bold text-ak-800 hover:border-ak-800">
            Track parcel{track.company ? ` · ${track.company}` : ""}
          </a>
        )}
        <button
          type="button"
          onClick={() => openChat({ topic: "Payment or refund", order: o.name })}
          className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-[13.5px] font-bold text-ink hover:border-ak-800"
        >
          Payment or refund issue?
        </button>
      </div>
    </li>
  );
}

function SignInCard() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_20px_50px_-30px_rgba(46,18,143,0.5)] sm:p-8">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ak-50 text-ak-800"><Icon size={28} d={I.user} /></span>
      <h2 className="mt-4 font-display text-[26px] font-bold text-ink">Sign in or create account</h2>
      <p className="mt-2 text-[15px] text-muted">Enter your email and we&apos;ll send you a 6-digit code. No password needed.</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          signIn("/account").catch(() => setBusy(false));
        }}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-ak-800 text-[15px] font-bold text-white transition-colors hover:bg-ak-900 disabled:opacity-70"
      >
        {busy ? "Opening secure sign-in…" : "Continue with email"}
      </button>
      <ul className="mt-6 space-y-2 text-left text-[14px] text-ink">
        {["Track your orders and deliveries", "Faster checkout with saved address", "Help with payments and refunds"].map((t) => (
          <li key={t} className="flex items-center gap-2"><span className="text-leaf"><Icon size={17} d={I.check} /></span>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function SignedIn() {
  const [data, setData] = useState<AccountCustomer | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    customerQuery<{ customer: AccountCustomer }>(ACCOUNT_QUERY)
      .then((d) => {
        if (!d) return;
        setData(d.customer);
        const a = d.customer.defaultAddress;
        /* remembered on this device so checkout can fill itself in */
        localStorage.setItem(
          "ak_profile",
          JSON.stringify({
            name: [d.customer.firstName, d.customer.lastName].filter(Boolean).join(" ") || [a?.firstName, a?.lastName].filter(Boolean).join(" "),
            email: d.customer.emailAddress?.emailAddress ?? "",
            mobile: (d.customer.phoneNumber?.phoneNumber ?? a?.phoneNumber ?? "").replace(/\D/g, "").slice(-10),
            address: [a?.address1, a?.address2].filter(Boolean).join(", "),
            city: a?.city ?? "",
            state: a?.province ?? "",
            pincode: a?.zip ?? "",
          })
        );
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center">
        <p className="text-[15px] text-ink">We couldn&apos;t load your account just now.</p>
        <p className="mt-1 text-[13px] text-muted">{error}</p>
        <div className="mt-4 flex justify-center gap-2">
          <a href={ACCOUNT_URL} className="rounded-lg bg-ak-800 px-4 py-2.5 text-[14px] font-bold text-white">Open account on Shopify</a>
          <button type="button" onClick={signOut} className="rounded-lg border border-line px-4 py-2.5 text-[14px] font-bold text-ink">Sign out</button>
        </div>
      </div>
    );
  }
  if (!data) return <p className="py-10 text-center text-muted">Loading your account…</p>;

  const orders = data.orders.nodes;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <h2 className="text-[20px] font-bold text-ink">My orders</h2>
        {orders.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-line bg-white p-6 text-center">
            <p className="text-[15px] text-ink">No orders yet.</p>
            <Link href="/browse" className="mt-3 inline-block rounded-lg bg-ak-800 px-5 py-2.5 text-[14px] font-bold text-white">Start shopping</Link>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {orders.map((o) => <OrderCard key={o.id} o={o} />)}
          </ul>
        )}
      </section>
      <aside className="flex flex-col gap-4">
        <div className="ak-card rounded-2xl p-5">
          <p className="text-[13px] font-semibold text-muted">Signed in as</p>
          <p className="mt-0.5 text-[17px] font-bold text-ink">{data.displayName}</p>
          {data.emailAddress?.emailAddress && <p className="text-[14px] text-muted">{data.emailAddress.emailAddress}</p>}
          {data.phoneNumber?.phoneNumber && <p className="text-[14px] text-muted">{data.phoneNumber.phoneNumber}</p>}
          <a href={`${ACCOUNT_URL}/profile`} className="mt-3 inline-block text-[14px] font-bold text-ak-800 hover:underline">Edit profile</a>
        </div>
        <div className="ak-card rounded-2xl p-5">
          <p className="text-[15px] font-bold text-ink">Saved addresses</p>
          {data.addresses.nodes.length === 0 ? (
            <p className="mt-1 text-[14px] text-muted">Your address is saved after your first order.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {data.addresses.nodes.map((a) => (
                <li key={a.id} className="text-[14px] leading-snug text-ink">
                  {a.id === data.defaultAddress?.id && <span className="mb-1 inline-block rounded bg-ak-50 px-1.5 text-[11px] font-bold text-ak-800">Default</span>}
                  {a.formatted.map((l, i) => <span key={i} className="block">{l}</span>)}
                </li>
              ))}
            </ul>
          )}
          <a href={`${ACCOUNT_URL}/profile`} className="mt-3 inline-block text-[14px] font-bold text-ak-800 hover:underline">Manage addresses</a>
        </div>
        <div className="ak-card flex flex-col gap-2 rounded-2xl p-5">
          <Link href="/wishlist" className="flex items-center gap-2 text-[14.5px] font-semibold text-ink hover:text-ak-800"><Icon size={18} d={I.heart()} />Wishlist</Link>
          <button type="button" onClick={() => openChat()} className="flex items-center gap-2 text-left text-[14.5px] font-semibold text-ink hover:text-ak-800"><Icon size={18} d={I.chat} />Chat with AapkiKitab Team{CONTACT.phone ? ` · ${CONTACT.phone}` : ""}</button>
          <button type="button" onClick={signOut} className="mt-2 h-11 rounded-lg border border-line text-[14px] font-bold text-ink hover:border-ak-800">Sign out</button>
        </div>
      </aside>
    </div>
  );
}

/* Without the Headless client ID: Shopify's hosted account pages. */
function HostedAccount() {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_20px_50px_-30px_rgba(46,18,143,0.5)] sm:p-8">
      <h2 className="font-display text-[26px] font-bold text-ink">Sign in or create account</h2>
      <p className="mt-2 text-[15px] text-muted">Enter your email and we&apos;ll send you a 6-digit code. No password needed.</p>
      <a href={ACCOUNT_URL} className="mt-6 flex h-12 items-center justify-center rounded-xl bg-ak-800 text-[15px] font-bold text-white hover:bg-ak-900">Continue with email</a>
      <a href={`${ACCOUNT_URL}/orders`} className="mt-3 block text-[14px] font-bold text-ak-800">My orders</a>
    </div>
  );
}

export default function AccountPage() {
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
        {!onSiteAccounts ? <HostedAccount /> : signedIn === null ? null : signedIn ? <SignedIn /> : <SignInCard />}
      </div>
    </div>
  );
}
