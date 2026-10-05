"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ACCOUNT_URL } from "@/data/settings";
import { onSiteAccounts } from "@/lib/customer-account";
import { openChat } from "./chat";
import { Icon, I } from "./ui";

/* The six profile shortcuts from the design: used in the phone menu and on My Account. */
const G = {
  orders: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  address: I.pin,
  reviews: I.star,
  help: I.chat,
  returns: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
};

export function ProfileLinks({ onNavigate }: { onNavigate?: () => void }) {
  const orders = onSiteAccounts ? "/account" : `${ACCOUNT_URL}/orders`;
  const items: { label: string; icon: ReactNode; href?: string; action?: () => void }[] = [
    { label: "My Orders", icon: G.orders, href: orders },
    { label: "My Address", icon: G.address, href: `${ACCOUNT_URL}/profile` },
    { label: "Customer Reviews", icon: G.reviews, href: "/community" },
    { label: "Help & Support (Chat)", icon: G.help, action: () => openChat() },
    { label: "Returns & Refunds", icon: G.returns, href: "/policies#returns" },
    { label: "Settings", icon: G.settings, href: `${ACCOUNT_URL}/profile` },
  ];
  const cls = "flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors hover:bg-ak-50";
  const inner = (it: (typeof items)[number]) => (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-ak-50 text-ak-800"><Icon size={21} d={it.icon} /></span>
      <span className="text-[12px] font-semibold leading-tight text-ink">{it.label}</span>
    </>
  );
  return (
    <ul className="grid grid-cols-3 gap-1 sm:grid-cols-6">
      {items.map((it) => (
        <li key={it.label}>
          {it.action ? (
            <button type="button" className={`w-full ${cls}`} onClick={() => { onNavigate?.(); it.action!(); }}>{inner(it)}</button>
          ) : it.href!.startsWith("http") ? (
            <a href={it.href} className={cls}>{inner(it)}</a>
          ) : (
            <Link href={it.href!} className={cls} onClick={onNavigate}>{inner(it)}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}
