"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BOOKS, inr, searchBooks, type Book } from "@/data/books";
import { BUDGETS, CATEGORIES, EXAMS, MOODS } from "@/data/taxonomy";
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

const NOTES = [
  { t: "Free shipping on orders above ₹499", icon: I.truck },
  { t: "100% original books", icon: I.shield },
  { t: "Verified physical bookstores", icon: I.store },
];

export function Announcement() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % NOTES.length), 4000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="bg-ak-900 text-white">
      {/* phones: one rotating note */}
      <p className="overflow-hidden px-4 py-2 text-center text-[12.5px] font-semibold md:hidden" aria-live="polite">
        <span key={i} className="ak-note inline-flex items-center gap-1.5">
          <Icon size={15} d={NOTES[i].icon} />
          {NOTES[i].t}
        </span>
      </p>
      <ul className="mx-auto hidden max-w-7xl items-center justify-between px-4 py-2 text-[13px] font-semibold md:flex">
        {NOTES.map((n) => (
          <li key={n.t} className="flex items-center gap-2">
            <Icon size={16} d={n.icon} />
            {n.t}
          </li>
        ))}
        <li>
          <Link href="/request-book" className="flex items-center gap-2 hover:underline">
            <Icon size={16} d={I.headset} />
            Need help?
          </Link>
        </li>
      </ul>
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
        className={`flex w-full items-stretch overflow-hidden rounded-lg border border-line bg-white transition-[border-color,box-shadow] focus-within:border-ak-800 focus-within:shadow-[0_0_0_4px_rgba(75,15,138,0.08)] ${compact ? "h-11" : "h-12"}`}
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
        <button type="submit" aria-label="Search" className="grid w-12 shrink-0 place-items-center bg-ak-800 text-white transition-colors hover:bg-ak-900 lg:w-14">
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

/* One hover/click disclosure for the desktop nav. Closes on route change, Escape, outside tap. */
function NavMenu({
  label,
  leading,
  active,
  width,
  children,
}: {
  label: string;
  leading?: React.ReactNode;
  active: boolean;
  width: number;
  children: React.ReactNode;
}) {
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
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 border-b-2 py-3 text-[15px] font-semibold transition-colors ${active || open ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`}
      >
        {leading}
        {label}
        <span className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <Icon size={15} d={I.chevron} />
        </span>
      </button>
      {open && (
        <div className="ak-menu absolute left-0 top-full z-50 pt-2" style={{ width }}>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_30px_60px_-30px_rgba(35,5,74,0.45)]">{children}</div>
        </div>
      )}
    </div>
  );
}

function MenuList({ title, items }: { title: string; items: { slug: string; label: string; href: string }[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted">{title}</p>
      <ul className="space-y-0.5">
        {items.map((t) => (
          <li key={t.slug}>
            <Link href={t.href} className="block rounded-lg px-2 py-1.5 text-[14.5px] font-semibold text-ink transition-colors hover:bg-ak-50 hover:text-ak-800">
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeaderAction({ href, label, icon, n, className = "" }: { href: string; label: string; icon: React.ReactNode; n?: number; className?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-ink transition-colors hover:text-ak-800 lg:px-3 ${className}`}
    >
      <span className="relative">
        <Icon size={23} d={icon} />
        {n !== undefined && <Count n={n} />}
      </span>
      <span className="hidden text-[12.5px] font-semibold lg:block">{label}</span>
    </Link>
  );
}

export function Header() {
  const { cartCount, wishlist } = useShop();
  const pathname = usePathname();
  const bookOfDay = BOOKS.find((b) => b.bookOfDay) ?? BOOKS[0];
  const browseActive =
    pathname === "/browse" || pathname.startsWith("/category/") || pathname.startsWith("/mood/") || pathname.startsWith("/budget/");
  const examActive = pathname.startsWith("/exam/") || pathname === "/category/education-exams";
  const linkCls = (href: string) =>
    `border-b-2 py-3 text-[15px] font-semibold transition-colors ${pathname === href ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 lg:gap-10 lg:py-4">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2.5 lg:gap-3" aria-label="Aapki Kitab home">
          <img src="/logo.webp" alt="" width={64} height={64} className="h-11 w-11 shrink-0 lg:h-16 lg:w-16" />
          <span className="leading-none">
            <span className="block whitespace-nowrap font-display text-[19px] font-bold tracking-[0.02em] text-ak-900 lg:text-[26px]">AAPKI KITAB</span>
            <span className="mt-1 block whitespace-nowrap text-[11.5px] text-muted lg:text-[14px]">Your Next Book Awaits.</span>
          </span>
        </Link>
        <div className="hidden flex-1 md:block"><SearchBar /></div>
        <nav className="ml-auto flex shrink-0 items-center md:ml-0" aria-label="Account">
          <HeaderAction href="/wishlist" label="Wishlist" icon={I.heart()} n={wishlist.length} />
          <HeaderAction href="/cart" label="Cart" icon={I.cart} n={cartCount} />
          <HeaderAction href="/account" label="Account" icon={I.user} className="hidden md:flex" />
        </nav>
      </div>
      <div className="px-4 pb-3 md:hidden"><SearchBar compact /></div>
      <nav className="hidden border-t border-line/70 lg:block" aria-label="Primary">
        <div className="mx-auto flex max-w-7xl items-center gap-12 px-4">
          <NavMenu label="All books" leading={<Icon size={20} d={I.menu} />} active={browseActive} width={760}>
            <div className="grid grid-cols-[1fr_1fr_1fr_200px] gap-6">
              <MenuList title="Categories" items={CATEGORIES.slice(0, 7)} />
              <MenuList title="Moods" items={MOODS} />
              <MenuList title="Budget" items={BUDGETS.map((b) => ({ slug: b.slug, label: b.label, href: `/budget/${b.slug}` }))} />
              <Link href={`/book/${bookOfDay.slug}`} className="group flex flex-col justify-between rounded-xl bg-ak-900 p-4 text-white">
                <span className="text-xs font-bold text-ak-100">Today&apos;s book</span>
                <span>
                  <span className="block font-display text-lg font-bold leading-tight">{bookOfDay.title}</span>
                  <span className="mt-0.5 block text-xs text-ak-100">{bookOfDay.author}</span>
                  <span className="tnum mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
                    {inr(bookOfDay.price)}
                    <span className="transition-transform group-hover:translate-x-1"><Icon size={15} d={I.arrow} /></span>
                  </span>
                </span>
              </Link>
              <Link href="/browse" className="col-span-4 border-t border-line pt-4 text-sm font-bold text-ak-800 hover:underline">
                Browse the full catalogue
              </Link>
            </div>
          </NavMenu>
          <NavMenu label="Education & Exams" active={examActive} width={420}>
            <div className="grid grid-cols-2 gap-x-4">
              <MenuList title="Competitive exams" items={EXAMS.slice(0, 6)} />
              <MenuList title="More" items={EXAMS.slice(6)} />
            </div>
          </NavMenu>
          {NAV.filter((n) => !["/", "/browse", "/category/education-exams"].includes(n.href)).map((n) => (
            <Link key={n.href} href={n.href} className={linkCls(n.href)}>
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
