"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
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

const NOTES = ["Free shipping on orders above ₹499", "Cash on delivery across India", "100% original books from verified bookstores"];

export function Announcement() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % NOTES.length), 4000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="bg-ak-950 text-white">
      <p className="mx-auto max-w-7xl overflow-hidden px-4 py-2 text-center text-[12.5px] font-semibold tracking-[0.02em]" aria-live="polite">
        <span key={i} className="ak-note inline-block">{NOTES[i]}</span>
      </p>
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
        className={`flex w-full items-center rounded-full border border-line bg-white pl-1 pr-1 transition-[border-color,box-shadow] focus-within:border-ak-800 focus-within:shadow-[0_0_0_4px_rgba(75,15,138,0.08)] ${compact ? "h-11" : "h-12"}`}
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
        <button type="submit" aria-label="Search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ak-800 text-white transition-colors hover:bg-ak-900">
          <Icon size={18} d={I.search} />
        </button>
      </form>
      {showDropdown && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_48px_-24px_rgba(35,5,74,0.35)]"
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

function BrowseMenu({ active, bookOfDay }: { active: boolean; bookOfDay: Book }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  const cols = [
    { h: "Categories", items: CATEGORIES.slice(0, 6) },
    { h: "Moods", items: MOODS.slice(0, 6) },
    { h: "Exams", items: EXAMS.slice(0, 6) },
  ];
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 border-b-2 py-3 text-[14.5px] font-semibold transition-colors ${active || open ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`}
      >
        Browse books
        <span className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <Icon size={15} d={<path d="m6 9 6 6 6-6" />} />
        </span>
      </button>
      {open && (
        <div className="ak-menu absolute left-1/2 top-full z-50 w-[760px] -translate-x-1/2 pt-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_200px] gap-6 rounded-2xl border border-line bg-white p-6 shadow-[0_30px_60px_-30px_rgba(35,5,74,0.45)]">
            {cols.map((c) => (
              <div key={c.h}>
                <p className="mb-2 text-xs font-bold text-muted">{c.h}</p>
                <ul className="space-y-0.5">
                  {c.items.map((t) => (
                    <li key={t.slug}>
                      <Link href={t.href} className="block rounded-lg px-2 py-1.5 text-[14.5px] font-semibold text-ink transition-colors hover:bg-ak-50 hover:text-ak-800">
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link href={`/book/${bookOfDay.slug}`} className="group flex flex-col justify-between rounded-xl bg-ak-950 p-4 text-white">
              <span className="text-xs font-bold text-ak-100">Book of the day</span>
              <span>
                <span className="block font-display text-lg font-bold leading-tight">{bookOfDay.title}</span>
                <span className="mt-0.5 block text-xs text-ak-100">{bookOfDay.author}</span>
                <span className="tnum mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
                  {inr(bookOfDay.price)}
                  <span className="transition-transform group-hover:translate-x-1"><Icon size={15} d={I.arrow} /></span>
                </span>
              </span>
            </Link>
            <Link href="/browse" className="col-span-4 -mb-1 border-t border-line pt-4 text-sm font-bold text-ak-800 hover:underline">
              Browse the full catalogue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { cartCount, wishlist } = useShop();
  const pathname = usePathname();
  const bookOfDay = BOOKS.find((b) => b.bookOfDay) ?? BOOKS[0];
  const browseActive =
    pathname === "/browse" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/mood/") ||
    pathname.startsWith("/exam/");
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-8">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="Aapki Kitab home">
          <img src="/logo.webp" alt="" width={44} height={44} className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <span className="leading-none">
            <span className="block whitespace-nowrap font-display text-[17px] font-bold tracking-[0.03em] text-ak-900 sm:text-[19px]">AAPKI KITAB</span>
            <span className="mt-0.5 block whitespace-nowrap text-[11px] font-semibold tracking-[0.04em] text-muted">Your next book awaits</span>
          </span>
        </Link>
        <div className="hidden max-w-xl flex-1 md:block lg:mx-auto"><SearchBar /></div>
        <nav className="ml-auto flex shrink-0 items-center sm:gap-2" aria-label="Account">
          <Link href="/wishlist" className="relative hidden h-10 w-10 place-items-center rounded-full text-ink hover:bg-ak-50 lg:grid" aria-label="Wishlist">
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
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-9 px-4">
          <Link
            href="/"
            className={`border-b-2 py-3 text-[14.5px] font-semibold transition-colors ${pathname === "/" ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`}
          >
            Home
          </Link>
          <BrowseMenu active={browseActive} bookOfDay={bookOfDay} />
          {NAV.filter((n) => n.href !== "/" && n.href !== "/browse").map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`border-b-2 py-3 text-[14.5px] font-semibold transition-colors ${pathname === n.href ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`}
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
              <span className="relative">
                <Icon size={21} d={t.icon} />
                <Count n={n} />
              </span>
              {t.label}
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
    <form onSubmit={submit} className="mt-6 max-w-sm" noValidate>
      <label htmlFor="ak-newsletter" className="text-sm font-bold text-white">
        New arrivals, every Sunday
      </label>
      <div className="mt-2 flex items-center overflow-hidden rounded-full bg-white">
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
          <button type="submit" className="m-1 shrink-0 rounded-full bg-ak-800 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-ak-700">
            Join
          </button>
        </Press>
      </div>
      {error && (
        <p id="ak-newsletter-error" role="alert" className="mt-1.5 text-xs font-semibold text-[#ffb4b4]">
          {error}
        </p>
      )}
    </form>
  );
}

export function Footer() {
  const cols: { h: string; links: [string, string][] }[] = [
    { h: "Shop", links: [["Browse books", "/browse"], ["New arrivals", "/new"], ["Trending", "/trending"], ["Offers", "/offers"], ["Book of the day", "/book/parth-the-promise"]] },
    { h: "Discover", links: [["Find my book", "/find-my-book"], ["Education & exams", "/category/education-exams"], ["Bookstores", "/bookstores"], ["Request a book", "/request-book"]] },
    { h: "Help", links: [["Contact", "/request-book"], ["Shipping policy", "/policies"], ["Returns & refunds", "/policies"], ["Privacy & terms", "/policies"]] },
  ];
  return (
    <footer className="mt-20 bg-ak-950 pb-20 text-white lg:pb-0">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 pb-12 pt-14 sm:grid-cols-3 lg:grid-cols-5 lg:pt-16">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="" width={52} height={52} className="h-13 w-13" />
            <p className="font-display text-2xl font-bold tracking-[0.04em]">AAPKI KITAB</p>
          </div>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ak-100">
            A premium independent bookstore. Real books from verified Indian bookstores, at honest prices.
          </p>
          <NewsletterForm />
        </div>
        {cols.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <p className="mb-3 text-sm font-bold text-white">{c.h}</p>
            <ul className="space-y-2">
              {c.links.map(([label, href]) => (
                <li key={href + label}>
                  <Link href={href} className="text-[15px] text-ak-100 transition-colors hover:text-white hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 px-4 py-6">
        <div className="flex flex-wrap items-center gap-2" aria-label="Accepted payments">
          {PAYMENTS.map((p) => (
            <span key={p} className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-ak-100">
              {p}
            </span>
          ))}
        </div>
        <p className="text-xs text-ak-100">© 2026 Aapki Kitab · Made with care in India</p>
      </div>
    </footer>
  );
}
