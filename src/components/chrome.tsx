"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BOOKS, inr, searchBooks, type Book } from "@/data/books";
import { ANNOUNCEMENTS, BUDGETS, CATEGORIES, EXAMS, MOODS } from "@/data/taxonomy";
import { CONTACT, FOOTER, FOOTER_COLUMNS, HEADER, HEADER_LINKS, mailLink, waLink } from "@/data/settings";
import { useShop } from "@/lib/store";
import { Icon, I, Price } from "./ui";
import { DeliveryBar, Drawer, VoiceButton } from "./header-bits";
import { Bump } from "./motion";

/* Header links come from Shopify (Menu link → "Header menu"); Books and Exams menus are built in. */
const NAV = HEADER_LINKS;

/* Optional top bar: shown only while a message is set in Homepage settings. */
export function Announcement() {
  const [i, setI] = useState(0);
  const n = ANNOUNCEMENTS.length;
  useEffect(() => {
    if (n <= 1) return;
    const id = window.setInterval(() => setI((k) => (k + 1) % n), 4000);
    return () => window.clearInterval(id);
  }, [n]);
  if (n === 0) return null;
  return (
    <div className="bg-ak-900 text-white" aria-live="polite">
      <p key={i} className="ak-note mx-auto max-w-7xl px-4 py-2 text-center text-[12.5px] font-semibold sm:text-[13px]">
        {ANNOUNCEMENTS[i % n]}
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
        className={`flex w-full items-center rounded-full border border-line bg-white pl-4 pr-1.5 shadow-[0_8px_24px_-14px_rgba(46,18,143,0.35)] transition-[border-color,box-shadow] focus-within:border-ak-800 focus-within:shadow-[0_0_0_4px_rgba(74,31,196,0.12)] ${compact ? "h-12" : "h-[52px]"}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (open && active >= 0 && suggestions[active]) goBook(suggestions[active].slug);
          else submitSearch();
        }}
      >
        <button type="submit" aria-label="Search" className="shrink-0 text-ink transition-colors hover:text-ak-800">
          <Icon size={22} d={I.search} />
        </button>
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
          placeholder={HEADER.searchPlaceholder}
          aria-label="Search books, gifts, art and craft"
          className="w-full bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-muted"
        />
        <VoiceButton
          onResult={(text) => {
            setQ(text);
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(text)}`);
          }}
          onUnsupported={() => inputRef.current?.focus()}
        />
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
      <span className="tnum absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ak-800 px-1 text-[10.5px] font-bold text-white ring-2 ring-white">
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
    <div ref={ref} className="relative h-full" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-full items-center gap-1.5 border-b-2 text-[15px] font-semibold transition-colors ${active || open ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`}
      >
        {leading}
        {label}
        <span className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          <Icon size={15} d={I.chevron} />
        </span>
      </button>
      {open && (
        <div className="ak-menu absolute left-0 top-full z-50 pt-1" style={{ width }}>
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
      className={`relative grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-white/70 hover:text-ak-800 ${className}`}
    >
      <span className="relative">
        <Icon size={25} d={icon} />
        {n !== undefined && <Count n={n} />}
      </span>
    </Link>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Aapki Kitab home">
      <img src="/logo.webp" alt="" width={44} height={44} className="h-10 w-10 lg:h-11 lg:w-11" />
      <span className="leading-none">
        <span className="block text-[22px] font-bold tracking-[-0.02em] text-ak-900 lg:text-[24px]">AapkiKitab</span>
        <span className="mt-1 block text-[10.5px] font-medium text-ink/80">{HEADER.tagline}</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { cartCount, wishlist } = useShop();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  const bookOfDay = BOOKS.find((b) => b.bookOfDay) ?? BOOKS[0];
  const browseActive =
    pathname === "/browse" || pathname.startsWith("/category/") || pathname.startsWith("/mood/") || pathname.startsWith("/budget/");
  const examActive = pathname.startsWith("/exam/") || pathname === "/category/education-exams";
  const linkCls = (href: string) =>
    `flex h-full items-center border-b-2 text-[15px] font-semibold transition-colors ${pathname === href ? "border-ak-800 text-ak-800" : "border-transparent text-ink hover:text-ak-800"}`;
  return (
    <>
      <header className="sticky top-0 z-40 bg-[#efe9ff]/90 backdrop-blur-md lg:border-b lg:border-line lg:bg-white/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 lg:h-[76px] lg:gap-8">
          <button
            type="button"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
            aria-expanded={menu}
            className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-white/70 lg:hidden"
          >
            <Icon size={26} d={I.menu} />
          </button>
          <Logo />
          <div className="ml-auto hidden w-full max-w-[560px] lg:block"><SearchBar compact /></div>
          <nav className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0" aria-label="Account">
            <HeaderAction href="/wishlist" label="Wishlist" icon={I.heart()} n={wishlist.length} />
            <HeaderAction href="/cart" label="Cart" icon={I.cart} n={cartCount} />
            <HeaderAction href="/account" label="Account" icon={I.user} className="hidden lg:grid" />
          </nav>
        </div>
        <div className="px-4 pb-3 lg:hidden"><SearchBar compact /></div>
        <nav className="mx-auto hidden h-12 max-w-7xl items-center gap-7 px-4 lg:flex" aria-label="Primary">
          <NavMenu label="Books" active={browseActive} width={760}>
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
          <NavMenu label="Exams" active={examActive} width={420}>
            <div className="grid grid-cols-2 gap-x-4">
              <MenuList title="Competitive exams" items={EXAMS.slice(0, 6)} />
              <MenuList title="More" items={EXAMS.slice(6)} />
            </div>
          </NavMenu>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={linkCls(n.href)}>
              {n.label}
            </Link>
          ))}
          <span className="ml-auto"><DeliveryBar inline /></span>
        </nav>
      </header>
      <div className="lg:hidden"><DeliveryBar /></div>
      {menu && <Drawer nav={NAV} onClose={closeMenu} />}
    </>
  );
}

const TABS = [
  { label: "Home", href: "/", icon: I.home },
  { label: "Categories", href: "/browse", icon: I.grid },
  { label: "Wishlist", href: "/wishlist", icon: I.heart() },
  { label: "Cart", href: "/cart", icon: I.cart },
  { label: "Account", href: "/account", icon: I.user },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useShop();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(46,18,143,0.3)] lg:hidden" aria-label="Mobile">
      <div className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname === t.href || pathname.startsWith(`${t.href}/`);
          const n = t.href === "/cart" ? cartCount : 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11.5px] font-semibold ${active ? "ak-tab-on text-ak-800" : "text-ink/75"}`}
            >
              <span className="relative">
                <Icon size={25} d={t.icon} />
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

/* Sign-ups go to the shop's WhatsApp (or email) so the owner actually receives them. */
function NewsletterCta() {
  const wa = waLink("Hi! Please add me to your new-arrivals updates.");
  const mail = mailLink("New arrivals updates", "Hi! Please add me to your new-arrivals updates.");
  const href = wa || mail;
  if (!href) return null;
  return (
    <div className="mt-6 max-w-sm">
      <p className="text-sm font-bold text-white">{FOOTER.newsletter}</p>
      <a
        href={href}
        target={wa ? "_blank" : undefined}
        rel="noreferrer"
        className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-ak-900 transition-colors hover:bg-ak-50"
      >
        <Icon size={17} d={I.chat} />
        {wa ? "Get updates on WhatsApp" : "Get updates by email"}
      </a>
    </div>
  );
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ak-950 pb-20 text-white lg:pb-0">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 pb-14 pt-16 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] lg:pt-20">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="" width={48} height={48} className="h-12 w-12" />
            <p className="font-display text-[26px] font-semibold tracking-[-0.02em]">Aapki Kitab</p>
          </div>
          <p className="mt-5 max-w-sm whitespace-pre-line text-[15.5px] leading-relaxed text-white/70">{FOOTER.about}</p>
          {(CONTACT.phone || CONTACT.email || CONTACT.address) && (
            <ul className="mt-5 space-y-1.5 text-[14.5px] text-white/75">
              {CONTACT.phone && <li><a href={CONTACT.phoneHref} className="hover:text-white">{CONTACT.phone}</a></li>}
              {CONTACT.email && <li><a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a></li>}
              {CONTACT.address && <li className="whitespace-pre-line">{CONTACT.address}</li>}
            </ul>
          )}
          {FOOTER.social.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {FOOTER.social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="inline-block rounded-full border border-white/20 px-3.5 py-1.5 text-[13px] font-semibold text-white/80 hover:border-white hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <NewsletterCta />
        </div>
        {FOOTER_COLUMNS.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <p className="mb-4 text-[14px] font-semibold text-marigold">{c.h}</p>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href + l.label}>
                  {isExternal(l.href) ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="text-[15px] text-white/75 transition-colors hover:text-white">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="text-[15px] text-white/75 transition-colors hover:text-white">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      {/* signature: the name in both scripts, set as the floor of the page */}
      <div aria-hidden="true" className="pointer-events-none mx-auto max-w-7xl select-none overflow-hidden px-4">
        <p className="flex items-baseline gap-6 whitespace-nowrap leading-[0.8] text-white/[0.07]">
          <span className="shrink-0 whitespace-nowrap font-display text-[clamp(4rem,13vw,11rem)] font-semibold tracking-[-0.04em]">Aapki Kitab</span>
          <span className="shrink-0 whitespace-nowrap font-deva text-[clamp(3.5rem,11vw,9rem)]">आपकी किताब</span>
        </p>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 px-4 py-6">
        <div className="flex flex-wrap items-center gap-2" aria-label="Accepted payments">
          {FOOTER.payments.map((p) => (
            <span key={p} className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] font-semibold text-white/70">
              {p}
            </span>
          ))}
        </div>
        <p className="text-[13px] text-white/55">{FOOTER.copyright}</p>
      </div>
    </footer>
  );
}
