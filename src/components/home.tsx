"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BOOKS, getBook, inr, type Book } from "@/data/books";
import { BUDGETS, BUDGET_IMAGE, EXAMS, GIFT_BOXES, MOODS, PROMOS, type Tile } from "@/data/taxonomy";
import { BookCard, Cover, Icon, I, Price, Rating, SectionHead } from "./ui";

/* ---------- drawn icons for discovery tiles (one 1.8px stroke family) ---------- */
const MOOD_ICON: Record<string, ReactNode> = {
  feel: I.heart(),
  thrill: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1 2.5 2 3 0-3 .5-6 1-8.5z" />,
  learn: <><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" /></>,
  reflect: <><path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18.4 5.6l-2.1 2.1M21 12h-3" /><path d="M7 16a5 5 0 0 1 10 0" /><path d="M4 20h16" /></>,
  love: <><path d="M9 19s-6-3.9-6-8a3.5 3.5 0 0 1 6-2.4A3.5 3.5 0 0 1 15 11" /><path d="M16 21s-4-2.6-4-5.4A2.4 2.4 0 0 1 16 14a2.4 2.4 0 0 1 4 1.6C20 18.4 16 21 16 21z" /></>,
  grow: <><path d="M12 21v-9" /><path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7z" /><path d="M12 14c0-3.5 2.5-6 7-6 0 3.5-2.5 6-7 6z" /></>,
  escape: <><path d="M3 6h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3z" /><path d="M21 6h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" /></>,
  light: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
};

const EXAM_ICON: Record<string, ReactNode> = {
  jee: <><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>,
  neet: <><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 13v3a4 4 0 0 0 8 0v-2" /><circle cx="18" cy="12" r="2" /></>,
  upsc: <><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></>,
  ssc: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  banking: <><path d="M3 9 12 4l9 5z" /><path d="M5 10v7M10 10v7M14 10v7M19 10v7M3 20h18" /></>,
  railway: <><rect x="6" y="3" width="12" height="14" rx="3" /><path d="M6 11h12M9 21l1.5-4M15 21l-1.5-4" /><circle cx="9.5" cy="14" r=".6" /><circle cx="14.5" cy="14" r=".6" /></>,
  cuet: <><path d="M3 6h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3z" /><path d="M21 6h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" /></>,
  cat: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  gate: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  school: <path d="M4 7h16v4H4zM5 11h14v4H5zM4 15h16v4H4z" />,
  college: <><path d="m2 9 10-5 10 5-10 5z" /><path d="M22 9v6" /></>,
  "maths-science": <path d="M5 5h14M5 5l6 7-6 7h14" />,
};

/* ---------- 1. promotional slider ---------- */
const SLIDE_MS = 5500;

export function PromoSlider() {
  const slides = PROMOS.flatMap((p) => {
    const b = getBook(p.book);
    return b ? [{ ...p, b }] : [];
  });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1 || paused) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [n, paused]);

  if (n === 0) return null; // no active promotion → slider hidden
  const go = (i: number) => setActive(((i % n) + n) % n);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-ak-950"
      aria-roledescription="carousel"
      aria-label="Featured books and offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((s, i) => (
          <article
            key={s.book}
            className="relative w-full shrink-0"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}: ${s.heading}`}
            aria-hidden={i !== active}
          >
            <img src={s.photo} alt="" loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
            {/* solid brand scrim keeps text legible on any photo */}
            <div aria-hidden="true" className="absolute inset-0 bg-ak-950/75" />
            <div className="relative grid min-h-[340px] items-center gap-6 px-6 pb-12 pt-8 sm:min-h-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-14 sm:py-10 lg:grid-cols-[minmax(0,1.15fr)_auto_minmax(0,0.85fr)] lg:gap-12 lg:px-20 lg:py-12">
              <div className="text-white">
                <h2 className="font-display text-[34px] font-bold leading-[1.02] tracking-[-0.02em] sm:text-[44px] lg:text-[56px]">
                  {s.heading}
                </h2>
                <p className="mt-4 text-[15px] text-ak-100 sm:text-[17px]">{s.lead}</p>
                <p className="mt-1 font-display text-[22px] font-bold uppercase leading-tight tracking-[0.02em] sm:text-[28px]">{s.b.title}</p>
                <p className="mt-1 text-[14px] text-ak-100 sm:text-[15px]">{s.note}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link
                    href={`/book/${s.b.slug}`}
                    tabIndex={i === active ? 0 : -1}
                    className="group inline-flex h-12 items-center gap-2 rounded-lg bg-white px-7 text-[15px] font-bold text-ak-900 transition-colors hover:bg-ak-100"
                  >
                    {s.cta}
                    <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={17} d={I.arrow} /></span>
                  </Link>
                  <span className="tnum text-[22px] font-bold text-white">{inr(s.b.price)}</span>
                </div>
              </div>
              <Link href={`/book/${s.b.slug}`} tabIndex={-1} aria-hidden="true" className="mx-auto hidden w-[170px] sm:block lg:w-[210px]">
                <span className="block -rotate-2 overflow-hidden rounded-md shadow-[0_30px_50px_-18px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:rotate-0">
                  <Cover book={s.b} sizes="210px" />
                </span>
              </Link>
              <p className="hidden font-display text-[26px] font-medium italic leading-snug text-white/90 lg:block">
                {s.b.blurb.split(".")[0]}.
              </p>
            </div>
          </article>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white hover:text-ak-900 sm:grid"
          >
            <span className="rotate-180"><Icon size={18} d={I.arrow} /></span>
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white hover:text-ak-900 sm:grid"
          >
            <Icon size={18} d={I.arrow} />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {slides.map((s, i) => (
              <button
                key={s.book}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className="grid h-7 place-items-center px-1"
              >
                <span className={`block h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-7 bg-white" : "w-3 bg-white/40"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 2. find your next book ---------- */
export function FindNextBook() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <h2 className="font-display text-[24px] font-bold leading-tight text-ink sm:text-[28px]">Find your next book</h2>
        <p className="mt-1 text-[15px] text-muted">Discover books by mood, interest and budget.</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
        <Link href="/browse" className="inline-flex h-12 items-center justify-center rounded-lg bg-ak-800 px-6 text-[15px] font-bold text-white transition-colors hover:bg-ak-900">
          Explore books
        </Link>
        <Link href="/find-my-book" className="inline-flex h-12 items-center justify-center rounded-lg border border-ak-800 px-6 text-[15px] font-bold text-ak-800 transition-colors hover:bg-ak-50">
          Find my book
        </Link>
      </div>
    </div>
  );
}

/* ---------- 3. mood panel ---------- */
export function MoodPanel() {
  return (
    <div className="rounded-2xl bg-ak-50 px-4 py-6 sm:px-6">
      <SectionHead title="What are you in the mood for?" href="/browse" />
      <div className="ak-rail ak-rail-mood">
        {MOODS.map((m) => (
          <Link
            key={m.slug}
            href={m.href}
            className="group flex flex-col items-center rounded-xl border border-line bg-white px-2 pb-3.5 pt-4 text-center transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-ak-800/30 hover:shadow-[0_14px_28px_-16px_rgba(54,8,115,0.5)]"
          >
            <span className="ak-duo ak-duo-dark grid h-16 w-16 place-items-center rounded-2xl bg-ak-800 text-white shadow-[0_10px_20px_-10px_rgba(54,8,115,0.7)] transition-[background-color,transform] duration-300 group-hover:-rotate-6 group-hover:scale-105 group-hover:bg-ak-900">
              <Icon size={34} d={MOOD_ICON[m.slug] ?? I.star} />
            </span>
            <span className="mt-3 text-[15.5px] font-bold text-ink">{m.label}</span>
            <span className="text-[12.5px] text-muted">{m.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- 4. education & exams ---------- */
export function ExamStrip() {
  return (
    <div>
      <SectionHead title="Education & Exams" href="/category/education-exams" />
      <div className="ak-rail ak-rail-exam">
        {EXAMS.map((e) => (
          <Link
            key={e.slug}
            href={e.href}
            className="group flex flex-col items-center gap-2.5 rounded-xl border border-line bg-white px-2 py-4 text-center transition-[border-color,box-shadow] duration-300 hover:border-ak-800/40 hover:shadow-[0_12px_24px_-16px_rgba(54,8,115,0.55)]"
          >
            <span className="ak-duo ak-duo-soft grid h-12 w-12 place-items-center rounded-xl bg-ak-100 text-ak-800 transition-[background-color,color,transform] duration-300 group-hover:scale-105 group-hover:bg-ak-800 group-hover:text-white">
              <Icon size={28} d={EXAM_ICON[e.slug] ?? I.grid} />
            </span>
            <span className="text-[13.5px] font-bold leading-tight text-ink">{e.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- 5. budget ---------- */
export function BudgetBand() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-ak-50">
      <img src={BUDGET_IMAGE} alt="" loading="lazy" className="absolute inset-y-0 left-0 hidden h-full w-56 object-cover lg:block" />
      <div className="relative grid items-center gap-5 px-6 py-7 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10 lg:py-6 lg:pl-64 lg:pr-8">
        <h2 className="font-display text-[26px] font-bold leading-[1.1] text-ink lg:text-[30px]">
          Find a book <br className="hidden lg:block" />
          within your budget
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BUDGETS.map((b, i) => (
            <Link
              key={b.slug}
              href={`/budget/${b.slug}`}
              className={`rounded-xl px-4 py-3 text-center transition-colors ${
                i === 1 ? "bg-ak-800 text-white hover:bg-ak-900" : "border border-ak-800/20 bg-white text-ak-900 hover:border-ak-800"
              }`}
            >
              <span className="block text-[13px] font-semibold opacity-80">Under</span>
              <span className="tnum block font-display text-[26px] font-bold leading-none">{b.label.replace(/^Under\s*/i, "")}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 6. categories (generic tile row) ---------- */
function TileThumb({ tile }: { tile: Tile }) {
  const [failed, setFailed] = useState(false);
  if (tile.image && !failed) {
    return (
      <img
        src={tile.image}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-14 w-11 shrink-0 rounded-md object-cover shadow-[0_6px_12px_-6px_rgba(35,5,74,0.45)]"
      />
    );
  }
  return (
    <span aria-hidden="true" className="grid h-14 w-11 shrink-0 place-items-center rounded-md bg-ak-100 font-display text-xl font-bold text-ak-800">
      {tile.label.charAt(0).toUpperCase()}
    </span>
  );
}

export function TileRow({ title, href, tiles }: { title: string; href?: string; tiles: Tile[] }) {
  if (tiles.length === 0) return null;
  return (
    <div>
      <SectionHead title={title} href={href} />
      <div className="ak-rail ak-rail-4 ak-rail-2row">
        {tiles.map((t) => (
          <Link
            key={t.slug}
            href={t.href}
            className="group flex items-center gap-3.5 rounded-xl border border-line bg-white p-3 transition-[border-color,box-shadow] duration-300 hover:border-ak-800/40 hover:shadow-[0_10px_24px_-14px_rgba(54,8,115,0.45)]"
          >
            <TileThumb tile={t} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-bold text-ink transition-colors group-hover:text-ak-800">{t.label}</span>
              <span className="block truncate text-[12.5px] text-muted">{t.sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- category shelf: each tile fans real covers from that category ---------- */
export function CategoryShelf({ tiles }: { tiles: Tile[] }) {
  const rows = tiles
    .map((t) => {
      const books = BOOKS.filter((b) => b.categories.includes(t.slug));
      return { t, count: books.length, covers: books.filter((b) => b.cover).slice(0, 3), first: books[0] };
    })
    .filter((r) => r.count > 0);
  if (rows.length === 0) return null;
  return (
    <div>
      <SectionHead title="Browse Categories" href="/browse" />
      <div className="ak-rail ak-rail-cat">
        {rows.map(({ t, count, covers, first }) => (
          <Link
            key={t.slug}
            href={t.href}
            className="group relative flex h-[148px] overflow-hidden rounded-2xl bg-ak-50 p-4 transition-colors duration-300 hover:bg-ak-100 lg:h-[164px] lg:p-5"
          >
            <span className="relative z-10 flex max-w-[52%] flex-col">
              <span className="font-display text-[19px] font-bold leading-tight text-ink lg:text-[21px]">{t.label}</span>
              <span className="tnum mt-1 text-[13px] font-semibold text-ak-800">
                {count} {count === 1 ? "book" : "books"}
              </span>
              <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-bold text-ink/70 transition-colors group-hover:text-ak-800">
                Explore
                <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={14} d={I.arrow} /></span>
              </span>
            </span>
            <span aria-hidden="true" className="absolute -bottom-3 right-3 h-[124px] w-[45%] lg:h-[140px]">
              {covers.length > 0 ? (
                covers.map((b, i) => (
                  <img
                    key={b.slug}
                    src={b.cover!}
                    alt=""
                    loading="lazy"
                    className="absolute bottom-0 aspect-[2/3] h-[88%] rounded-[4px] object-cover shadow-[0_12px_22px_-10px_rgba(35,5,74,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      right: `${i * 26}%`,
                      zIndex: 3 - i,
                      transform: `rotate(${[4, -3, -9][i]}deg)`,
                      transformOrigin: "bottom center",
                    }}
                  />
                ))
              ) : (
                <span className="absolute bottom-0 right-2 block aspect-[2/3] h-[88%] rotate-[4deg] overflow-hidden rounded-[4px] shadow-[0_12px_22px_-10px_rgba(35,5,74,0.6)]">
                  <Cover book={first} sizes="90px" />
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- 7/8. new arrivals + trending ---------- */
function BookShelf({ title, href, books }: { title: string; href: string; books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <div>
      <SectionHead title={title} href={href} />
      <div className="ak-rail">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
    </div>
  );
}

export function NewArrivals() {
  return <BookShelf title="New Arrivals" href="/new" books={BOOKS.filter((b) => b.isNew).slice(0, 6)} />;
}

export function Trending() {
  return <BookShelf title="Trending Books" href="/trending" books={BOOKS.filter((b) => b.trending).slice(0, 6)} />;
}

/* ---------- 9. curated gift boxes ---------- */
export function GiftBoxes() {
  if (GIFT_BOXES.length === 0) return null;
  return (
    <div>
      <SectionHead title="Curated Gift Boxes" sub="Make a gift that feels personal." />
      <div className="ak-rail ak-rail-gift">
        {GIFT_BOXES.map((g) => (
          <article key={g.slug} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 rounded-2xl border border-line bg-white p-3">
            <img src={g.photo} alt="" loading="lazy" className="aspect-[4/5] h-full w-full rounded-xl object-cover" />
            <div className="flex flex-col py-1 pr-1">
              <h3 className="font-display text-[20px] font-bold leading-tight text-ink">{g.name}</h3>
              <ul className="mt-2 space-y-1 text-[13.5px] text-muted">
                {g.items.map((it) => (
                  <li key={it} className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-ak-800"><Icon size={13} d={I.check} /></span>
                    {it}
                  </li>
                ))}
              </ul>
              <p className="tnum mt-auto pt-3 font-display text-[24px] font-bold text-ink">{inr(g.price)}</p>
              <Link
                href={`/request-book?gift=${encodeURIComponent(g.name)}`}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-ak-800 text-[14px] font-bold text-white transition-colors hover:bg-ak-900"
              >
                Order this box
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- 10. today's book ---------- */
export function BookOfDay() {
  const book = BOOKS.find((b) => b.bookOfDay);
  if (!book) return null;
  return (
    <div className="grid items-center gap-6 rounded-2xl bg-ak-50 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_minmax(0,1.1fr)_auto] lg:gap-10 lg:py-9">
      <div>
        <h2 className="whitespace-nowrap font-display text-[32px] font-bold leading-tight text-ink lg:text-[34px]">Today&apos;s Book</h2>
        <p className="mt-1 text-[15px] text-muted">A special book, handpicked for you.</p>
      </div>
      <Link href={`/book/${book.slug}`} className="block w-[130px] lg:w-full" aria-label={book.title}>
        <span className="block overflow-hidden rounded-md shadow-[0_20px_36px_-16px_rgba(35,5,74,0.55)]">
          <Cover book={book} sizes="150px" />
        </span>
      </Link>
      <div>
        <p className="font-display text-[24px] font-bold leading-tight text-ink">{book.title}</p>
        <p className="mt-0.5 text-[14.5px] text-muted">{book.author}</p>
        <div className="mt-2"><Rating value={book.rating} count={book.reviews} /></div>
        <div className="mt-2"><Price value={book.price} mrp={book.mrp} big /></div>
      </div>
      <p className="max-w-md text-[15px] leading-relaxed text-ink/80">{book.blurb}</p>
      <Link
        href={`/book/${book.slug}`}
        className="group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-ak-800 px-6 text-[15px] font-bold text-white transition-colors hover:bg-ak-900"
      >
        Discover this book
        <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={17} d={I.arrow} /></span>
      </Link>
    </div>
  );
}

/* ---------- 11. real reader reviews (only real, submitted reviews — never seeded) ---------- */
interface StoredReview {
  name: string;
  stars: number;
  text: string;
  date: string;
}

export function ReaderReviews() {
  const [reviews, setReviews] = useState<{ book: Book; r: StoredReview }[]>([]);
  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("ak_reviews") ?? "{}") as Record<string, StoredReview[]>;
      const flat = Object.entries(all).flatMap(([slug, list]) => {
        const book = getBook(slug);
        return book ? list.map((r) => ({ book, r })) : [];
      });
      setReviews(flat.sort((a, b) => b.r.date.localeCompare(a.r.date)).slice(0, 3));
    } catch {
      setReviews([]);
    }
  }, []);
  const lead = BOOKS.find((b) => b.trending && b.cover) ?? BOOKS[0];

  return (
    <div>
      <SectionHead title="Real Readers. Real Reviews." sub="What readers say about the books they bought." />
      {reviews.length > 0 ? (
        <div className="ak-rail ak-rail-gift">
          {reviews.map(({ book, r }) => (
            <Link
              key={`${book.slug}-${r.date}`}
              href={`/book/${book.slug}`}
              className="flex gap-4 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-ak-800/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink">{r.name}</p>
                <p className="text-gold" aria-label={`${r.stars} out of 5 stars`}>
                  {"★★★★★".slice(0, r.stars)}
                  <span className="text-line">{"★★★★★".slice(r.stars)}</span>
                </p>
                <p className="mt-1 line-clamp-3 text-[14px] text-ink/80">&ldquo;{r.text}&rdquo;</p>
                <p className="mt-2 truncate text-[12.5px] font-semibold text-ak-800">{book.title}</p>
              </div>
              <span className="w-16 shrink-0 overflow-hidden rounded"><Cover book={book} sizes="64px" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-ak-800/30 bg-white px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ak-50 text-gold"><Icon size={24} d={I.star} /></span>
            <p className="max-w-lg text-[15px] text-ink/80">
              Reviews here come only from readers who bought from us, never paid or invented ratings. Read a book from us? Your review helps the next reader choose.
            </p>
          </div>
          <Link
            href={`/book/${lead.slug}#reviews`}
            className="inline-flex h-12 shrink-0 items-center rounded-lg border border-ak-800 px-6 text-[15px] font-bold text-ak-800 transition-colors hover:bg-ak-50"
          >
            Write a review
          </Link>
        </div>
      )}
    </div>
  );
}

/* Recently viewed rail (local-only history). Re-exported here for home + PDP use. */
export { RecentlyViewed } from "./recently-viewed";
