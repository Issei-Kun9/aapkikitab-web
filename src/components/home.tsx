"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BOOKS, inr, type Book } from "@/data/books";
import { BUDGETS, MOODS, type Tile } from "@/data/taxonomy";
import { BookCard, Cover, Icon, I, Price, SectionHead } from "./ui";
import { Press } from "./motion";

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
        className="h-14 w-14 shrink-0 rounded-xl border border-line object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ak-100 font-display text-2xl text-ak-800"
    >
      {tile.label.charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- hero: the one authored motion moment ---------- */
const HERO_SLUGS = ["ikigai", "the-alchemist", "atomic-habits", "the-silent-patient", "psychology-of-money"];
const FAN = [
  { rotate: -16, x: "-108%", y: 54, z: 1 },
  { rotate: -8, x: "-56%", y: 18, z: 2 },
  { rotate: 0, x: "0%", y: 0, z: 5 },
  { rotate: 8, x: "56%", y: 20, z: 3 },
  { rotate: 16, x: "108%", y: 58, z: 1 },
];
const HERO_MOODS = ["feel", "thrill", "learn", "grow", "reflect", "escape"];

export function Hero() {
  const reduce = useReducedMotion();
  const books = HERO_SLUGS.map((s) => BOOKS.find((b) => b.slug === s)).filter((b): b is Book => !!b?.cover);
  const moods = MOODS.filter((m) => HERO_MOODS.includes(m.slug));
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="ak-bleed relative overflow-hidden bg-ak-950 text-white">
      {/* hairline shelf grid: texture from the brand colour, no gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px)", backgroundSize: "100% 56px" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-12 lg:grid-cols-[1fr_1.05fr] lg:gap-4 lg:pb-20 lg:pt-20">
        <div>
          <h1 className="font-display text-[48px]! leading-[0.98]! font-bold tracking-[-0.035em] text-white! sm:text-[68px]! lg:text-[88px]!">
            Your next book <span className="text-[#c9b4ef]">awaits.</span>
          </h1>
          <p className="mt-5 max-w-[30rem] text-[17px] leading-relaxed text-ak-100! sm:text-lg">
            Original books from verified Indian bookstores, at honest prices. Pay on delivery, return within 7 days.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Press>
              <Link
                href="/trending"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-ak-900 transition-colors hover:bg-ak-100"
              >
                Shop bestsellers
                <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={17} d={I.arrow} /></span>
              </Link>
            </Press>
            <Link
              href="/find-my-book"
              className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 text-[15px] font-bold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Help me choose
            </Link>
          </div>
          <div className="mt-8">
            <p className="text-sm font-semibold text-ak-100!">Browse by mood</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {moods.map((m) => (
                <Link
                  key={m.slug}
                  href={m.href}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-ak-900"
                >
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* fanned stack of real covers */}
        <div className="relative mx-auto h-[280px] w-full max-w-[520px] sm:h-[380px] lg:h-[460px]">
          {books.map((b, i) => {
            const f = FAN[i];
            return (
              <motion.div
                key={b.slug}
                className="absolute left-1/2 top-1/2 w-[34%] max-w-[200px]"
                style={{ zIndex: f.z, marginLeft: "-17%", marginTop: "-25%" }}
                initial={reduce ? false : { opacity: 0, y: 60, rotate: 0, x: "0%" }}
                animate={{ opacity: 1, y: f.y, rotate: f.rotate, x: f.x }}
                transition={{ duration: 1.1, ease, delay: 0.15 + i * 0.12 }}
                whileHover={reduce ? undefined : { y: f.y - 14, rotate: f.rotate * 0.6, transition: { duration: 0.35, ease } }}
              >
                <Link href={`/book/${b.slug}`} className="block" aria-label={`${b.title} by ${b.author}, ${inr(b.price)}`}>
                  <img
                    src={b.cover!}
                    alt=""
                    width={190}
                    height={285}
                    fetchPriority={i === 1 ? "high" : "auto"}
                    className="aspect-[2/3] w-full rounded-md object-cover shadow-[0_24px_40px_-12px_rgba(10,0,30,0.7)]"
                  />
                  <span className="tnum absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[13px] font-bold text-ak-900 shadow-[0_6px_16px_-6px_rgba(10,0,30,0.5)]">
                    {inr(b.price)}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* reassurance rail, part of the hero, not another boxed strip */}
      <ul className="relative mx-auto grid max-w-7xl grid-cols-2 border-t border-white/10 text-[13.5px] sm:grid-cols-4">
        {TRUST.map((x, i) => (
          <li
            key={x.t}
            className={`flex items-center gap-2.5 px-4 py-5 sm:px-6 ${i % 2 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 sm:border-t-0 sm:border-l" : ""}`}
          >
            <span className="text-ak-100"><Icon size={18} d={x.d} /></span>
            <span className="leading-tight">
              <span className="block font-bold text-white">{x.t}</span>
              <span className="block text-xs text-ak-100/70">{x.s}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- generic tile row ---------- */
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
            className="group flex items-center gap-3.5 rounded-2xl border border-line bg-white p-3 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-ak-800/40 hover:shadow-[0_10px_24px_-14px_rgba(54,8,115,0.45)]"
            aria-label={t.label}
          >
            <TileThumb tile={t} />
            <span className="leading-tight">
              <span className="block text-[15px] font-bold text-ink transition-colors group-hover:text-ak-800">{t.label}</span>
              <span className="block text-xs text-muted">{t.sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- mood shelf: cover-forward tiles ---------- */
export function MoodShelf() {
  return (
    <div>
      <SectionHead title="What are you in the mood for?" href="/browse" />
      <div className="ak-rail ak-rail-4 lg:gap-5!">
        {MOODS.map((m) => (
          <Link
            key={m.slug}
            href={m.href}
            className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ak-900"
          >
            {m.image && (
              <img
                src={m.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
              />
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-ak-950/90 px-4 py-3.5 text-white">
              <span className="leading-tight">
                <span className="block font-display text-[22px] font-bold">{m.label}</span>
                <span className="block text-[12.5px] text-ak-100">{m.sub}</span>
              </span>
              <span className="mb-1 transition-transform duration-300 group-hover:translate-x-1"><Icon size={18} d={I.arrow} /></span>
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
    <div className="ak-bleed bg-ak-800 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 lg:grid-cols-[1fr_2fr] lg:py-16">
        <div>
          <h2 className="font-display text-[34px]! font-bold leading-[1.05]! text-white! lg:text-[44px]!">Shop by budget</h2>
          <p className="mt-2 max-w-xs text-[15px] text-ak-100!">Great books at honest prices. Pick a number and start reading.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BUDGETS.map((b) => (
            <Link
              key={b.slug}
              href={`/budget/${b.slug}`}
              className="group rounded-2xl border border-white/20 px-5 py-5 transition-colors hover:border-white hover:bg-white hover:text-ak-900"
            >
              <span className="block text-[13px] font-semibold text-ak-100 transition-colors group-hover:text-ak-800">Under</span>
              <span className="tnum block font-display text-[34px] font-bold leading-none lg:text-[40px]">{b.label.replace(/^Under\s*/i, "")}</span>
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

/* ---------- carousels ---------- */
export function NewArrivals() {
  const books = BOOKS.filter((b) => b.isNew).slice(0, 10);
  if (books.length === 0) return null;
  return (
    <div>
      <SectionHead title="New arrivals" href="/new" />
      <div className="ak-rail ak-rail-4 lg:gap-8!">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
    </div>
  );
}

export function Trending() {
  const books = BOOKS.filter((b) => b.trending && b.cover).slice(0, 6);
  if (books.length === 0) return null;
  const [lead, ...rest] = books;
  return (
    <div>
      <SectionHead title="Bestsellers this week" href="/trending" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <Link
          href={`/book/${lead.slug}`}
          className="group grid items-center gap-6 rounded-[28px] bg-ak-50 p-6 sm:grid-cols-[200px_1fr] sm:p-8 lg:grid-cols-[230px_1fr]"
        >
          <span className="relative mx-auto block w-[180px] sm:w-full">
            <span className="tnum absolute -left-3 -top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-ak-800 font-display text-xl font-bold text-white">1</span>
            <img
              src={lead.cover!}
              alt={`${lead.title} cover`}
              loading="lazy"
              className="aspect-[2/3] w-full rounded-lg object-cover shadow-[0_24px_40px_-18px_rgba(35,5,74,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:-rotate-1"
            />
          </span>
          <span className="block">
            <span className="block font-display text-[30px] font-bold leading-[1.05] text-ink lg:text-[38px]">{lead.title}</span>
            <span className="mt-1 block text-[15px] text-muted">{lead.author}</span>
            <span className="mt-4 block max-w-sm text-[15px] leading-relaxed text-ink/80">{lead.blurb}</span>
            <span className="mt-5 block"><Price value={lead.price} mrp={lead.mrp} big /></span>
            <span className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-ak-800 px-7 text-[15px] font-bold text-white transition-colors group-hover:bg-ak-900">
              View book <Icon size={17} d={I.arrow} />
            </span>
          </span>
        </Link>
        <ol className="divide-y divide-line">
          {rest.map((b, i) => (
            <li key={b.slug}>
              <Link href={`/book/${b.slug}`} className="group flex items-center gap-4 py-3.5">
                <span className="tnum w-8 shrink-0 font-display text-[28px] font-bold leading-none text-ak-800/35 transition-colors group-hover:text-ak-800">
                  {i + 2}
                </span>
                <img
                  src={b.cover!}
                  alt=""
                  loading="lazy"
                  className="h-[84px] w-14 shrink-0 rounded object-cover shadow-[0_8px_16px_-8px_rgba(35,5,74,0.5)] transition-transform duration-300 group-hover:-translate-y-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold text-ink transition-colors group-hover:text-ak-800">{b.title}</span>
                  <span className="block truncate text-[13.5px] text-muted">{b.author}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tnum block text-[16px] font-bold text-ink">{inr(b.price)}</span>
                  <span className="tnum block text-[12px] text-muted line-through">{inr(b.mrp)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------- book of the day ---------- */
export function BookOfDay() {
  const book = BOOKS.find((b) => b.bookOfDay);
  if (!book) return null;
  return (
    <div className="ak-bleed bg-ak-50">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:grid-cols-[220px_1fr] lg:grid-cols-[300px_1fr] lg:gap-14 lg:py-20">
        <div className="mx-auto w-full max-w-[220px] -rotate-2 overflow-hidden rounded-lg shadow-[0_30px_50px_-20px_rgba(35,5,74,0.55)] lg:max-w-[300px]">
          <Cover book={book} />
        </div>
        <div>
          <p className="text-sm font-bold text-ak-800">Book of the day</p>
          <h2 className="mt-2 font-display text-[40px]! font-bold leading-[1.02]! text-ink lg:text-[56px]!">{book.title}</h2>
          <p className="mt-2 text-[15px] text-muted">by {book.author}</p>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink/80">{book.blurb}</p>
          <div className="mt-3">
            <Price value={book.price} mrp={book.mrp} big />
          </div>
          <Link
            href={`/book/${book.slug}`}
            className="mt-5 inline-block rounded-full bg-ak-800 px-7 py-3 text-[15px] font-bold text-white transition-colors hover:bg-ak-900"
          >
            Discover this book
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Recently viewed rail (local-only history). Re-exported here for home + PDP use. */
export { RecentlyViewed } from "./recently-viewed";
