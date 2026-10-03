"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/lib/store";
import { Icon, I } from "./ui";
import { Bump } from "./motion";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Browse Books", href: "/browse" },
  { label: "Education & Exams", href: "/category/education-exams" },
  { label: "New Arrivals", href: "/new" },
  { label: "Offers", href: "/offers" },
  { label: "Bookstores", href: "/bookstores" },
];

export function Announcement() {
  return (
    <div className="bg-ak-900 text-[12.5px] font-semibold text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 overflow-x-auto whitespace-nowrap px-4 py-1.5">
        <span>Free shipping on orders above ₹499</span>
        <span className="hidden sm:inline">100% Original Books</span>
        <span className="hidden md:inline">Verified Physical Bookstores</span>
      </div>
    </div>
  );
}

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className={`flex w-full items-center overflow-hidden rounded-full border border-line bg-ak-50 focus-within:border-ak-800 ${compact ? "h-10" : "h-11"}`}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search books, authors or ISBN…"
        aria-label="Search books, authors or ISBN"
        className="w-full bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted"
      />
      <button type="submit" aria-label="Search" className="grid h-full w-12 shrink-0 place-items-center bg-ak-800 text-white">
        <Icon size={18} d={I.search} />
      </button>
    </form>
  );
}

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <Bump value={n}>
      <span className="tnum absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ak-800 px-1 text-[10px] font-bold text-white">
        {n > 99 ? "99+" : n}
      </span>
    </Bump>
  );
}

export function Header() {
  const { cartCount, wishlist } = useShop();
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Aapki Kitab home">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ak-800 font-display text-lg text-white">अK</span>
          <span className="leading-none">
            <span className="block font-display text-[17px] tracking-wide text-ink">AAPKI KITAB</span>
            <span className="block text-[10.5px] text-muted">Your Next Book Awaits.</span>
          </span>
        </Link>
        <div className="hidden flex-1 md:block"><SearchBar /></div>
        <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Account">
          <Link href="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ak-50" aria-label="Wishlist">
            <Icon size={21} d={I.heart()} /><Count n={wishlist.length} />
          </Link>
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ak-50" aria-label="Cart">
            <Icon size={21} d={I.cart} /><Count n={cartCount} />
          </Link>
          <Link href="/account" className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ak-50" aria-label="Account">
            <Icon size={21} d={I.user} />
          </Link>
        </nav>
      </div>
      <div className="px-4 pb-2.5 md:hidden"><SearchBar compact /></div>
      <nav className="hidden border-t border-line/70 lg:block" aria-label="Primary">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`border-b-2 py-2.5 text-[14.5px] font-semibold ${pathname === n.href ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

const TABS = [
  { label: "Home", href: "/", icon: I.home },
  { label: "Search", href: "/search", icon: I.search },
  { label: "Browse", href: "/browse", icon: I.grid },
  { label: "Wishlist", href: "/wishlist", icon: I.heart() },
  { label: "Cart", href: "/cart", icon: I.cart },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlist } = useShop();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile">
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = pathname === t.href;
          const n = t.href === "/cart" ? cartCount : t.href === "/wishlist" ? wishlist.length : 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-ak-800" : "text-muted"}`}
            >
              <Icon size={21} d={t.icon} />
              {t.label}
              <Count n={n} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Footer() {
  const cols: { h: string; links: [string, string][] }[] = [
    { h: "Shop", links: [["Browse Books", "/browse"], ["New Arrivals", "/new"], ["Trending Books", "/trending"], ["Offers", "/offers"], ["Book of the Day", "/book/parth-the-promise"]] },
    { h: "Discover", links: [["Find My Book", "/find-my-book"], ["Education & Exams", "/category/education-exams"], ["Bookstores", "/bookstores"], ["Request a Book", "/request-book"]] },
    { h: "Help", links: [["Contact", "/request-book"], ["Shipping Policy", "/policies"], ["Returns & Refunds", "/policies"], ["Privacy & Terms", "/policies"]] },
  ];
  return (
    <footer className="mt-14 border-t border-line bg-ak-50/60 pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-display text-xl text-ink">AAPKI KITAB</p>
          <p className="mt-1 text-sm text-muted">Your Next Book Awaits. A premium independent bookstore — real books, verified sellers, honest prices.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <p className="mb-2 text-sm font-bold text-ink">{c.h}</p>
            <ul className="space-y-1.5">
              {c.links.map(([label, href]) => (
                <li key={href + label}><Link href={href} className="text-sm text-muted underline-offset-4 hover:text-ak-800 hover:underline">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">© 2026 Aapki Kitab · Made with care in India</p>
    </footer>
  );
}
