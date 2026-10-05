"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BOOKS, CRAFT, inr } from "@/data/books";
import { BUDGETS, EXAMS, GIFT_BOXES, MOODS, type Tile } from "@/data/taxonomy";
import { Cover, CraftCard, Icon, I, Rating, SectionHead } from "./ui";
import { CRAFT_TYPES } from "@/data/settings";

const coversFor = (tag: string, n = 3) =>
  BOOKS.filter((b) => b.cover && (b.moods.includes(tag) || b.categories.includes(tag) || b.exams.includes(tag))).slice(0, n);

/* ---------- exam glyphs (one stroke family with the rest of the icon set) ---------- */
const EXAM_ICON: Record<string, ReactNode> = {
  jee: <><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></>,
  neet: <><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 13v3a4 4 0 0 0 8 0v-2" /><circle cx="18" cy="12" r="2" /></>,
  upsc: <><path d="M3 10 12 4l9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></>,
  ssc: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>,
  banking: <><path d="M3 9 12 4l9 5z" /><path d="M5 10v7M10 10v7M14 10v7M19 10v7M3 20h18" /></>,
  railway: <><rect x="6" y="3" width="12" height="14" rx="3" /><path d="M6 11h12M9 21l1.5-4M15 21l-1.5-4" /></>,
  cuet: <><path d="M3 6h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3z" /><path d="M21 6h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" /></>,
  cat: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  gate: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  school: <path d="M4 7h16v4H4zM5 11h14v4H5zM4 15h16v4H4z" />,
  college: <><path d="m2 9 10-5 10 5-10 5z" /><path d="M22 9v6" /></>,
  "maths-science": <path d="M5 5h14M5 5l6 7-6 7h14" />,
};

/* ---------- moods: a word you can feel, with the books it opens onto ---------- */
export function MoodPanel() {
  if (MOODS.length === 0) return null;
  return (
    <div>
      <SectionHead title="What do you feel like reading?" href="/browse" />
      <div className="ak-rail ak-rail-mood">
        {MOODS.map((m) => {
          const covers = coversFor(m.slug);
          return (
            <Link
              key={m.slug}
              href={m.href}
              className="group relative flex h-[168px] flex-col overflow-hidden rounded-2xl bg-ak-50 p-4 transition-colors duration-500 hover:bg-ak-800 lg:h-[196px] lg:p-5"
            >
              <span className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink transition-colors duration-500 group-hover:text-white lg:text-[34px]">
                {m.label}
              </span>
              <span className="mt-1.5 text-[13px] text-muted transition-colors duration-500 group-hover:text-white/70">{m.sub}</span>
              <span aria-hidden="true" className="absolute -bottom-6 right-3 h-[104px] w-[62%] lg:h-[118px]">
                {covers.map((b, i) => (
                  <img
                    key={b.slug}
                    src={b.cover!}
                    alt=""
                    loading="lazy"
                    className="ak-fan absolute bottom-0 aspect-[2/3] h-full rounded-[3px] object-cover shadow-[0_10px_18px_-8px_rgba(23,10,46,0.6)]"
                    style={{ right: `${i * 22}%`, zIndex: 3 - i, ["--r" as string]: `${[6, -4, -12][i]}deg`, ["--x" as string]: `${[10, -6, -22][i]}px` }}
                  />
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- categories: every tile fans real covers from that category ---------- */
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
      <SectionHead title="Browse the shelves" href="/browse" />
      <div className="ak-rail ak-rail-cat">
        {rows.map(({ t, count, covers, first }) => (
          <Link
            key={t.slug}
            href={t.href}
            className="group relative flex h-[156px] overflow-hidden rounded-2xl border border-line bg-white p-5 transition-[border-color,box-shadow] duration-500 hover:border-transparent hover:shadow-[0_24px_40px_-24px_rgba(23,10,46,0.45)] lg:h-[172px]"
          >
            <span className="relative z-10 flex max-w-[52%] flex-col">
              <span className="font-display text-[21px] font-semibold leading-tight text-ink lg:text-[23px]">{t.label}</span>
              <span className="tnum mt-1 text-[13px] text-muted">
                {count} {count === 1 ? "book" : "books"}
              </span>
              <span className="mt-auto inline-flex items-center gap-1 text-[13.5px] font-bold text-ak-800">
                Explore
                <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={14} d={I.arrow} /></span>
              </span>
            </span>
            <span aria-hidden="true" className="absolute -bottom-3 right-3 h-[124px] w-[46%] lg:h-[140px]">
              {covers.length > 0 ? (
                covers.map((b, i) => (
                  <img
                    key={b.slug}
                    src={b.cover!}
                    alt=""
                    loading="lazy"
                    className="ak-fan absolute bottom-0 aspect-[2/3] h-[88%] rounded-[3px] object-cover shadow-[0_12px_22px_-10px_rgba(23,10,46,0.6)]"
                    style={{ right: `${i * 26}%`, zIndex: 3 - i, ["--r" as string]: `${[4, -3, -9][i]}deg`, ["--x" as string]: `${[8, -4, -18][i]}px` }}
                  />
                ))
              ) : (
                <span className="absolute bottom-0 right-2 block aspect-[2/3] h-[88%] rotate-[4deg] overflow-hidden rounded-[3px] shadow-[0_12px_22px_-10px_rgba(23,10,46,0.6)]">
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

/* ---------- exams: a dark band with every exam one tap away ---------- */
export function ExamStrip() {
  if (EXAMS.length === 0) return null;
  return (
    <div className="ak-bleed bg-ak-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] lg:gap-14 lg:py-16">
        <div>
          <h2 className="font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.025em] lg:text-[44px]">Preparing for an exam?</h2>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-white/70">
            The standard prep books for every major exam, from verified bookshops.
          </p>
          <Link href="/category/education-exams" className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-bold text-marigold hover:underline">
            All exam books <Icon size={15} d={I.arrow} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {EXAMS.map((e) => (
            <Link
              key={e.slug}
              href={e.href}
              className="group flex flex-col items-start gap-3 rounded-xl border border-white/10 p-3.5 transition-colors hover:border-marigold hover:bg-white/[0.04] lg:p-4"
            >
              <span className="text-white/70 transition-colors group-hover:text-marigold"><Icon size={24} d={EXAM_ICON[e.slug] ?? I.grid} /></span>
              <span>
                <span className="block text-[15px] font-bold leading-tight">{e.label}</span>
                <span className="block text-[12px] text-white/50">{e.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- budget: the numbers are the design ---------- */
export function BudgetBand() {
  if (BUDGETS.length === 0) return null;
  return (
    <div className="ak-bleed bg-marigold text-ak-950">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14 lg:py-14">
        <h2 className="font-display text-[30px] font-semibold leading-[1.02] tracking-[-0.025em] lg:text-[38px]">
          Books under
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {BUDGETS.map((b) => (
            <Link key={b.slug} href={`/budget/${b.slug}`} className="group flex items-baseline justify-between gap-2 border-b-2 border-ak-950/20 pb-2 transition-colors hover:border-ak-950">
              <span className="tnum font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none tracking-[-0.03em]">
                {b.label.replace(/^Under\s*/i, "")}
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={20} d={I.arrow} /></span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- art & craft: the stationery corner of the shop ---------- */
/* Art & craft types come from Shopify (Discovery tile → "Art & Craft type"). */
export const CRAFT_GROUPS = CRAFT_TYPES;

export function ArtCraft() {
  if (CRAFT.length === 0) return null;
  const hero = CRAFT.find((c) => c.cover) ?? CRAFT[0];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] lg:gap-10">
      <Link href="/art-craft" className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl bg-ak-950 p-7 text-white lg:min-h-0">
        {hero.cover && (
          <img src={hero.cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-ak-950/45" />
        <div className="relative">
          <h2 className="font-display text-[36px] font-semibold leading-[1] tracking-[-0.03em] lg:text-[46px]">Art &amp; craft</h2>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/80">Paints, brushes, journals and craft kits, chosen by readers who make things.</p>
          <span className="mt-5 inline-flex h-11 items-center rounded-lg bg-marigold px-5 text-[14.5px] font-bold text-ak-950 transition-colors group-hover:bg-[#ffb83d]">
            Shop the craft corner
          </span>
        </div>
      </Link>
      <div>
        <div className="mb-5 flex flex-wrap gap-2">
          {CRAFT_GROUPS.filter((g) => CRAFT.some((c) => c.categories.includes(g.slug))).map((g) => (
            <Link key={g.slug} href={`/art-craft?type=${g.slug}`} className="rounded-full border border-line px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:border-ak-800 hover:text-ak-800">
              {g.label}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
          {CRAFT.slice(0, 4).map((c) => (
            <CraftCard key={c.slug} item={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- gift boxes ---------- */
export function GiftBoxes() {
  if (GIFT_BOXES.length === 0) return null;
  return (
    <div id="gift-boxes" className="scroll-mt-40">
      <SectionHead title="Gift a book, beautifully" sub="Curated boxes with a book, a bookmark and a handwritten-style card." />
      <div className="ak-rail ak-rail-gift">
        {GIFT_BOXES.map((g) => (
          <article key={g.slug} className="group flex flex-col">
            <div className="overflow-hidden rounded-2xl">
              <img src={g.photo} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
            </div>
            <div className="flex flex-1 flex-col pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-[22px] font-semibold leading-tight text-ink">{g.name}</h3>
                <span className="tnum shrink-0 font-display text-[22px] font-semibold text-ink">{inr(g.price)}</span>
              </div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{g.items.join(", ")}</p>
              <Link
                href={g.product ? `/book/${g.product}` : `/request-book?gift=${encodeURIComponent(g.name)}`}
                className="mt-4 inline-flex h-11 items-center justify-center self-start rounded-lg border border-ak-800/30 px-5 text-[14px] font-bold text-ak-800 transition-colors hover:border-ak-800 hover:bg-ak-800 hover:text-white"
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

/* ---------- today's book: a dark editorial spread ---------- */
export function BookOfDay() {
  const book = BOOKS.find((b) => b.bookOfDay);
  if (!book) return null;
  return (
    <div className="ak-bleed relative overflow-hidden bg-ak-950 text-white">
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-4 select-none font-deva text-[clamp(8rem,22vw,20rem)] leading-none text-white/[0.04]">
        आज
      </span>
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 lg:py-20">
        <Link href={`/book/${book.slug}`} className="ak-plinth group mx-auto block w-[220px] lg:w-[300px]" aria-label={book.title}>
          <span className="ak-card-book block overflow-hidden rounded-[2px_5px_5px_2px] shadow-[22px_30px_50px_-20px_rgba(0,0,0,0.85)]">
            <Cover book={book} sizes="300px" />
          </span>
        </Link>
        <div>
          <p className="text-[15px] font-semibold text-marigold">Today&apos;s book</p>
          <h2 className="mt-3 font-display text-[40px] font-semibold leading-[1] tracking-[-0.03em] lg:text-[64px]">{book.title}</h2>
          <p className="mt-3 text-[16px] text-white/65">by {book.author}</p>
          <p className="mt-6 max-w-lg font-display text-[19px] leading-relaxed text-white/85">{book.blurb}</p>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-[15px] text-white/70">
            <span className="tnum text-[28px] font-bold text-white">{inr(book.price)}</span>
            {book.mrp > book.price && <span className="tnum line-through">{inr(book.mrp)}</span>}
            <span className="[&_*]:!text-white/80"><Rating value={book.rating} count={book.reviews} /></span>
          </div>
          <Link href={`/book/${book.slug}`} className="mt-8 inline-flex h-12 items-center rounded-lg bg-marigold px-7 text-[15px] font-bold text-ak-950 transition-[background-color,transform] hover:bg-[#ffb83d] active:scale-[0.97]">
            Discover this book
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- find your next book: the three-question shortcut ---------- */
export function FindNextBook() {
  const covers = BOOKS.filter((b) => b.cover).slice(3, 7);
  return (
    <div className="relative grid items-center gap-8 overflow-hidden rounded-3xl border border-line p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <h2 className="font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink lg:text-[40px]">Not sure what to read next?</h2>
        <p className="mt-3 max-w-lg text-[16px] text-muted">Pick a mood, a budget and a language. We&apos;ll pull the right books off the shelf.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/find-my-book" className="inline-flex h-12 items-center rounded-lg bg-ak-800 px-6 text-[15px] font-bold text-white transition-colors hover:bg-ak-900">Find my book</Link>
          <Link href="/browse" className="inline-flex h-12 items-center rounded-lg border border-ak-800/30 px-6 text-[15px] font-bold text-ak-800 transition-colors hover:border-ak-800">Browse everything</Link>
        </div>
      </div>
      <div aria-hidden="true" className="relative hidden h-[180px] w-[300px] lg:block">
        {covers.map((b, i) => (
          <img key={b.slug} src={b.cover!} alt="" loading="lazy" className="absolute bottom-0 aspect-[2/3] h-[170px] rounded-[3px] object-cover shadow-[0_14px_24px_-10px_rgba(23,10,46,0.55)]" style={{ left: `${i * 58}px`, transform: `rotate(${[-8, -2, 4, 10][i]}deg)` }} />
        ))}
      </div>
    </div>
  );
}

/* Recently viewed rail (local-only history). Re-exported here for home + PDP use. */
export { RecentlyViewed } from "./recently-viewed";
