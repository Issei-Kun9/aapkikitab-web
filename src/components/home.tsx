"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BOOKS, inr } from "@/data/books";
import { BUDGETS, BUDGET_IMAGE, CATEGORIES, DISCOVERY_IMAGE, PROMOS, STORES, type Tile } from "@/data/taxonomy";
import { BookCard, Cover, Icon, I, Price, SectionHead } from "./ui";

/* ---------- tile thumbnail: relevant photo, monogram fallback ---------- */
function TileThumb({ tile }: { tile: Tile }) {
  const [failed, setFailed] = useState(false);
  if (tile.image && !failed) {
    return (
      <img
        src={tile.image}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ak-100 font-display text-xl text-ak-800"
    >
      {tile.label.charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- promo slider ---------- */
export function PromoSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const n = PROMOS.length;
    const next = ((i % n) + n) % n;
    setActive(next);
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (PROMOS.length <= 1 || paused) return;
    const id = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % PROMOS.length;
        const track = trackRef.current;
        if (track) track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [paused]);

  if (PROMOS.length === 0) return null;

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div
      className="relative"
      aria-roledescription="carousel"
      aria-label="Promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-line"
        style={{ scrollbarWidth: "none" }}
      >
        {PROMOS.map((p, i) => (
          <article
            key={p.heading}
            className="grid w-full shrink-0 snap-center items-center gap-4 px-6 py-8 sm:grid-cols-[1fr_260px] sm:gap-6 sm:px-10 sm:py-10 lg:grid-cols-[1fr_340px]"
            style={{ backgroundColor: p.tint }}
            aria-roledescription="slide"
            aria-label={p.heading}
          >
            <div className="flex flex-col justify-center gap-2">
              <h2 className="font-display text-[26px] leading-tight text-ink sm:text-[34px]">
                {p.heading}
              </h2>
              <p className="max-w-md text-[15px] text-ink/80">{p.text}</p>
              <p className="tnum text-lg font-bold text-ak-800">{p.price}</p>
              <div>
                <Link
                  href={p.href}
                  className="inline-block rounded-full bg-ak-800 px-6 py-2.5 text-sm font-bold text-white"
                >
                  {p.cta}
                </Link>
              </div>
            </div>
            <img
              src={p.image}
              alt=""
              loading={p === PROMOS[0] ? "eager" : "lazy"}
              className={`h-44 w-full rounded-xl border border-white/60 object-cover transition-transform duration-[5000ms] ease-out sm:h-52 lg:h-60 ${i === active ? "scale-[1.04]" : "scale-100"}`}
            />
          </article>
        ))}
      </div>

      {PROMOS.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label="Previous promotion"
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink"
          >
            <span className="rotate-180"><Icon size={17} d={I.arrow} /></span>
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label="Next promotion"
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink"
          >
            <Icon size={17} d={I.arrow} />
          </button>
          <div className="mt-2 flex items-center justify-center gap-3" role="tablist" aria-label="Promotion dots">
            <div className="flex gap-1.5">
              {PROMOS.map((p, i) => (
                <button
                  key={p.heading}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Go to promotion ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-ak-800" : "w-2 bg-line"}`}
                />
              ))}
            </div>
            <span className="tnum text-xs font-bold text-muted" aria-live="polite">
              {active + 1} / {PROMOS.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- discovery ---------- */
export function Discovery() {
  return (
    <div className="grid items-center gap-6 rounded-2xl border border-line bg-white px-6 py-8 sm:py-10 lg:grid-cols-[1fr_320px]">
      <div className="text-center lg:text-left">
        <h2 className="font-display text-[24px] leading-tight text-ink sm:text-[30px]">
          Find Your Next Book
        </h2>
        <p className="mx-auto mt-1 max-w-md text-[15px] text-muted lg:mx-0">
          Tell us what you love to read and we will match you with books from verified bookstores.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <Link
            href="/browse"
            className="rounded-full bg-ak-800 px-6 py-2.5 text-sm font-bold text-white"
          >
            EXPLORE BOOKS
          </Link>
          <Link
            href="/find-my-book"
            className="rounded-full border border-ak-800 px-6 py-2.5 text-sm font-bold text-ak-800"
          >
            FIND MY BOOK
          </Link>
        </div>
      </div>
      <img
        src={DISCOVERY_IMAGE}
        alt="Reader with books"
        loading="lazy"
        className="h-44 w-full rounded-xl object-cover lg:h-56"
      />
    </div>
  );
}

/* ---------- generic tile row ---------- */
export function TileRow({ title, href, tiles }: { title: string; href?: string; tiles: Tile[] }) {
  if (tiles.length === 0) return null;
  return (
    <div>
      <SectionHead title={title} href={href} />
      <div className="ak-rail ak-rail-4">
        {tiles.map((t) => (
          <Link
            key={t.slug}
            href={t.href}
            className="flex items-center gap-3 rounded-xl border border-line bg-white p-3"
            aria-label={t.label}
          >
            <TileThumb tile={t} />
            <span className="leading-tight">
              <span className="block text-[14.5px] font-bold text-ink">{t.label}</span>
              <span className="block text-xs text-muted">{t.sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- budget band ---------- */
export function BudgetBand() {
  return (
    <div className="grid items-center gap-6 rounded-2xl bg-ak-50 px-6 py-8 sm:py-10 lg:grid-cols-[280px_1fr]">
      <img
        src={BUDGET_IMAGE}
        alt="Stack of books"
        loading="lazy"
        className="hidden h-44 w-full rounded-xl object-cover lg:block"
      />
      <div className="text-center">
        <h2 className="font-display text-[22px] leading-tight text-ink lg:text-[28px]">
          Shop By Budget
        </h2>
        <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">
          Great books at honest prices — pick a budget and start browsing.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {BUDGETS.map((b) => (
            <Link
              key={b.slug}
              href={`/budget/${b.slug}`}
              className="tnum rounded-full bg-ak-800 px-6 py-2.5 text-sm font-bold text-white"
            >
              {b.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- trust strip ---------- */
const TRUST = [
  { t: "Cash on Delivery", s: "Pay at your door", d: <><rect x="3" y="7" width="18" height="11" rx="2" /><circle cx="12" cy="12.5" r="2.4" /><path d="M6.5 10.5h.01M17.5 15h.01" /></> },
  { t: "Easy 7-Day Returns", s: "No-question returns", d: <><path d="M4 9a8 8 0 0 1 14-3l2 2" /><path d="M20 4v4h-4" /><path d="M20 15a8 8 0 0 1-14 3l-2-2" /><path d="M4 20v-4h4" /></> },
  { t: "Secure UPI Payments", s: "UPI · Cards · NetBanking", d: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></> },
  { t: "100% Original Books", s: "Verified bookstores", d: <><path d="m5 12.5 4.5 4.5L19 7.5" /></> },
];

export function TrustStrip() {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {TRUST.map((x) => (
        <div key={x.t} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ak-50 text-ak-800">
            <Icon size={19} d={x.d} />
          </span>
          <span className="leading-tight">
            <span className="block text-[13.5px] font-bold text-ink">{x.t}</span>
            <span className="block text-xs text-muted">{x.s}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- proof strip: honest computed stats ---------- */
export function ProofStrip() {
  const titles = BOOKS.length;
  const authors = new Set(BOOKS.map((b) => b.author)).size;
  const stores = STORES.length;
  const avg = BOOKS.length
    ? (BOOKS.reduce((s, b) => s + b.rating, 0) / BOOKS.length).toFixed(1)
    : "0.0";
  const stats = [
    { value: String(titles), label: "Curated titles" },
    { value: String(authors), label: "Authors" },
    { value: String(stores), label: "Verified bookstores" },
    { value: avg, label: "Average rating" },
  ];
  return (
    <div className="grid grid-cols-2 rounded-2xl border border-line bg-white lg:grid-cols-4" aria-label="Store highlights">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`px-4 py-5 text-center ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line" : ""} lg:border-t-0 ${i > 0 ? "lg:border-l" : "lg:border-l-0"}`}
        >
          <p className="tnum font-display text-[26px] leading-none text-ink lg:text-[32px]">{s.value}</p>
          <p className="mt-1 text-[13px] text-muted">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- featured authors rail ---------- */
export function FeaturedAuthors() {
  const counts = new Map<string, number>();
  for (const b of BOOKS) counts.set(b.author, (counts.get(b.author) ?? 0) + 1);
  const authors = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (authors.length === 0) return null;
  return (
    <div>
      <SectionHead title="Featured Authors" href="/browse" />
      <div className="ak-rail ak-rail-4">
        {authors.map(([name, n]) => (
          <Link
            key={name}
            href={`/search?q=${encodeURIComponent(name)}`}
            className="flex items-center gap-3 rounded-xl border border-line bg-white p-3"
            aria-label={`${name}, ${n} ${n === 1 ? "book" : "books"}`}
          >
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ak-100 font-display text-xl text-ak-800"
            >
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="leading-tight">
              <span className="block truncate text-[14.5px] font-bold text-ink">{name}</span>
              <span className="tnum block text-xs text-muted">
                {n} {n === 1 ? "book" : "books"}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- carousels ---------- */
export function NewArrivals() {
  const books = BOOKS.filter((b) => b.isNew).slice(0, 10);
  if (books.length === 0) return null;
  return (
    <div>
      <SectionHead title="New Arrivals" href="/new" />
      <div className="ak-rail">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
    </div>
  );
}

export function Trending() {
  const books = BOOKS.filter((b) => b.trending).slice(0, 10);
  if (books.length === 0) return null;
  return (
    <div>
      <SectionHead title="Trending Now" href="/trending" />
      <div className="ak-rail">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
    </div>
  );
}

/* ---------- book of the day ---------- */
export function BookOfDay() {
  const book = BOOKS.find((b) => b.bookOfDay);
  if (!book) return null;
  return (
    <div className="rounded-2xl bg-ak-50 px-6 py-8 sm:px-10">
      <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-xl border border-line lg:max-w-[280px]">
          <Cover book={book} />
        </div>
        <div>
          <h2 className="font-display text-[24px] leading-tight text-ink sm:text-[30px]">
            Book Of The Day
          </h2>
          <p className="mt-3 text-xl font-bold text-ink">{book.title}</p>
          <p className="text-sm text-muted">{book.author}</p>
          <p className="mt-2 max-w-xl text-[15px] text-ink/80">{book.blurb}</p>
          <div className="mt-3">
            <Price value={book.price} mrp={book.mrp} big />
          </div>
          <Link
            href={`/book/${book.slug}`}
            className="mt-4 inline-block rounded-full bg-ak-800 px-6 py-2.5 text-sm font-bold text-white"
          >
            DISCOVER THIS BOOK
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Recently viewed rail (local-only history). Re-exported here for home + PDP use. */
export { RecentlyViewed } from "./recently-viewed";
