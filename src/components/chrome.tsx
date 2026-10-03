"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { BOOKS, inr, searchBooks, type Book } from "@/data/books";
import { CATEGORIES, EXAMS, MOODS } from "@/data/taxonomy";
import { useShop } from "@/lib/store";
import { Icon, I, Price } from "./ui";
import { Bump, Press } from "./motion";

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

function SuggestThumb({ book }: { book: Book }) {
  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt=""
        loading="lazy"
        className="h-12 w-9 shrink-0 rounded border border-line object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-9 shrink-0 place-items-center rounded bg-ak-100 font-display text-base text-ak-800"
    >
      {book.title.charAt(0).toUpperCase()}
    </span>
  );
}

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `${useId()}-suggestions`;
  const showDropdown = open && q.trim().length > 0;

  /* 120ms debounced top-6 from the real catalog. */
  useEffect(() => {
    const needle = q.trim();
    if (!needle) {
      setSuggestions([]);
      setActive(-1);
      return;
    }
    const id = window.setTimeout(() => {
      setSuggestions(searchBooks(needle).slice(0, 6));
      setActive(-1);
    }, 120);
    return () => window.clearTimeout(id);
  }, [q]);

  /* Close on route change. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Close on outside tap. */
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const submitSearch = () => {
    const needle = q.trim();
    if (!needle) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(needle)}`);
  };

  const goBook = (slug: string) => {
    setOpen(false);
    router.push(`/book/${slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && open && active >= 0 && suggestions[active]) {
      e.preventDefault();
      goBook(suggestions[active].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        className={`flex w-full items-center overflow-hidden rounded-full border border-line bg-ak-50 focus-within:border-ak-800 ${compact ? "h-10" : "h-11"}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (open && active >= 0 && suggestions[active]) goBook(suggestions[active].slug);
          else submitSearch();
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="Search books, authors or ISBN…"
          aria-label="Search books, authors or ISBN"
          className="w-full bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted"
        />
        <button type="submit" aria-label="Search" className="grid h-full w-12 shrink-0 place-items-center bg-ak-800 text-white">
          <Icon size={18} d={I.search} />
        </button>
      </form>
      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white"
        >
          {suggestions.map((b, i) => (
            <li key={b.slug} role="option" id={`${listId}-${i}`} aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => goBook(b.slug)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? "bg-ak-50" : "bg-white"}`}
              >
                <SuggestThumb book={b} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-semibold text-ink">{b.title}</span>
                  <span className="block truncate text-xs text-muted">{b.author}</span>
                </span>
                <Price value={b.price} mrp={b.mrp} />
              </button>
            </li>
          ))}
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">
              No quick matches — press Enter to search.
            </li>
          ) : (
            <li>
              <button
                type="button"
                tabIndex={-1}
                onClick={submitSearch}
                className="tnum w-full bg-white px-4 py-2.5 text-left text-sm font-bold text-ak-800"
              >
                See all results for &ldquo;{q.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
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
  const router = useRouter();
  const bookOfDay = BOOKS.find((b) => b.bookOfDay) ?? BOOKS[0];
  const browseActive =
    pathname === "/browse" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/mood/") ||
    pathname.startsWith("/exam/");
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
          <Link
            href="/"
            className={`border-b-2 py-2.5 text-[14.5px] font-semibold ${pathname === "/" ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`}
          >
            Home
          </Link>
          <DropdownMenu
            button={{
              label: "Browse Books",
              variant: "ghost",
              className: `!border-b-2 !rounded-none !px-0 !py-2.5 text-[14.5px] font-semibold ${browseActive ? "!border-ak-800 !text-ak-800" : "!border-transparent !text-ink hover:!text-ak-800"}`,
            }}
            menuWidth={520}
            placement="below"
            alignment="start"
            items={[
              {
                type: "section",
                title: "Categories",
                items: CATEGORIES.slice(0, 6).map((c) => ({
                  id: `cat-${c.slug}`,
                  label: c.label,
                  description: c.sub,
                  onClick: () => router.push(c.href),
                })),
              },
              {
                type: "section",
                title: "Moods",
                items: MOODS.slice(0, 6).map((m) => ({
                  id: `mood-${m.slug}`,
                  label: m.label,
                  description: m.sub,
                  onClick: () => router.push(m.href),
                })),
              },
              {
                type: "section",
                title: "Exams",
                items: EXAMS.slice(0, 6).map((e) => ({
                  id: `exam-${e.slug}`,
                  label: e.label,
                  description: e.sub,
                  onClick: () => router.push(e.href),
                })),
              },
              { type: "divider" },
              {
                id: "book-of-day",
                label: `Book of the Day — ${bookOfDay.title}`,
                description: bookOfDay.author,
                endContent: (
                  <span className="tnum text-[13px] font-bold text-ak-800">{inr(bookOfDay.price)}</span>
                ),
                onClick: () => router.push(`/book/${bookOfDay.slug}`),
              },
              {
                id: "browse-all",
                label: "Browse all books",
                description: "Full catalogue with filters",
                onClick: () => router.push("/browse"),
              },
            ]}
          />
          {NAV.filter((n) => n.href !== "/" && n.href !== "/browse").map((n) => (
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

const PAYMENTS = ["UPI", "Visa", "Mastercard", "RuPay", "NetBanking", "COD"];

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError("Enter a valid email address.");
      return;
    }
    try {
      localStorage.setItem("ak_newsletter", v);
    } catch {
      /* storage unavailable — still confirm */
    }
    setError(null);
    setDone(true);
  };

  if (done) {
    return (
      <p role="status" className="mt-3 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink">
        You are on the list. New arrivals, every Sunday.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3" noValidate>
      <label htmlFor="ak-newsletter" className="text-sm font-bold text-ink">
        New arrivals, every Sunday
      </label>
      <div className="mt-1.5 flex items-center overflow-hidden rounded-full border border-line bg-white focus-within:border-ak-800">
        <input
          id="ak-newsletter"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.in"
          aria-label="Email address"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "ak-newsletter-error" : undefined}
          className="w-full bg-transparent px-4 py-2 text-sm text-ink outline-none placeholder:text-muted"
        />
        <Press>
          <button type="submit" className="m-1 shrink-0 rounded-full bg-ak-800 px-5 py-1.5 text-sm font-bold text-white">
            Join
          </button>
        </Press>
      </div>
      {error && (
        <p id="ak-newsletter-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </form>
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
          <NewsletterForm />
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
      <div className="mx-auto max-w-7xl px-4 pb-2">
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5" aria-label="Accepted payments">
          {PAYMENTS.map((p) => (
            <span key={p} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-ink">
              {p}
            </span>
          ))}
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">© 2026 Aapki Kitab · Made with care in India</p>
    </footer>
  );
}
