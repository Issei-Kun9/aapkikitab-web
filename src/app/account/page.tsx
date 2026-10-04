"use client";

import Link from "next/link";
import { Icon, I } from "@/components/ui";
import { ACCOUNT_URL } from "@/data/settings";

/* Accounts live with Shopify: customers sign in with a one-time code sent to their email,
   and see real orders, delivery status and saved addresses there. */
const ROWS = [
  { label: "My orders & delivery status", sub: "Track, view and get help with orders", href: `${ACCOUNT_URL}/orders`, icon: I.box },
  { label: "Profile & saved addresses", sub: "Name, email, phone and addresses", href: `${ACCOUNT_URL}/profile`, icon: I.user },
  { label: "Wishlist", sub: "Books you saved for later", href: "/wishlist", icon: I.heart() },
  { label: "Help & contact", sub: "Questions about an order or payment", href: "/request-book", icon: I.headset },
];

export default function AccountPage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">My Account</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="overflow-hidden rounded-2xl border border-line bg-white">
          {ROWS.map((r) => {
            const external = r.href.startsWith("http");
            const inner = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ak-50 text-ak-800"><Icon size={20} d={r.icon} /></span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[15px] font-bold text-ink">{r.label}</span>
                  <span className="block text-[13px] text-muted">{r.sub}</span>
                </span>
                <Icon size={16} d={I.arrow} />
              </>
            );
            const cls = "flex items-center gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-0 hover:bg-ak-50";
            return (
              <li key={r.label}>
                {external ? <a href={r.href} className={cls}>{inner}</a> : <Link href={r.href} className={cls}>{inner}</Link>}
              </li>
            );
          })}
        </ul>
        <div className="h-fit rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-xl font-bold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-muted">
            Enter your email and we&apos;ll send a one-time code. No password to remember.
          </p>
          <a href={ACCOUNT_URL} className="mt-4 flex h-12 items-center justify-center rounded-lg bg-ak-800 text-[15px] font-bold text-white transition-colors hover:bg-ak-900">
            Sign in with email code
          </a>
        </div>
      </div>
    </div>
  );
}
