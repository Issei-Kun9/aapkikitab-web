"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BOOKS, inr, type Book } from "@/data/books";
import { MOODS } from "@/data/taxonomy";
import { Icon, I } from "./ui";

/* Books stand at slightly different heights, like a real shelf. Height follows
   page count so a thick exam guide stands taller than a slim novel. */
function bookHeight(b: Book) {
  const p = Math.min(Math.max(b.pages || 250, 150), 900);
  return Math.round(176 + ((p - 150) / 750) * 44);
}
const thickness = (b: Book) => Math.round(14 + (Math.min(Math.max(b.pages || 250, 150), 900) - 150) / 750 * 20);
/* spine cloth colours, picked per book so the shelf reads as many editions */
const SPINES = ["#2c0d5c", "#5b0fa8", "#7a1f3d", "#1f4d5a", "#3b2a14", "#4a1670", "#1d3b2a"];
const spineOf = (b: Book) => SPINES[[...b.slug].reduce((n, c) => n + c.charCodeAt(0), 0) % SPINES.length];

const LEAN = new Set([3, 9]); // two books lean on their neighbours

export function ShelfHero() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [q, setQ] = useState("");
  const shelf = [...BOOKS.filter((b) => b.trending), ...BOOKS.filter((b) => !b.trending)]
    .filter((b) => b.cover)
    .slice(0, 13);

  return (
    <section className="ak-bleed relative overflow-hidden bg-ak-950 text-white">
      {/* bilingual texture: the word for book, set as architecture */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-10 select-none font-deva text-[clamp(10rem,30vw,26rem)] leading-none text-white/[0.045] lg:-top-16"
      >
        किताब
      </span>

      <div className="relative mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
        <div className="max-w-3xl">
          <h1 className="font-display text-[clamp(2.6rem,6.2vw,5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
            Your next book awaits.
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/75 lg:text-[18px]">
            Original books from real Indian bookshops, at honest prices. Pay on delivery, return within seven days.
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
            className="mt-7 hidden h-14 max-w-xl sm:flex rounded-xl bg-white p-1.5 items-center shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] focus-within:ring-4 focus-within:ring-marigold/40"
          >
            <span className="pl-3 text-muted"><Icon size={20} d={I.search} /></span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search books, authors or ISBN"
              placeholder="Search a title, author or ISBN"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="h-full shrink-0 rounded-lg bg-marigold px-5 text-[15px] font-bold text-ak-950 transition-[background-color,transform] hover:bg-[#ffb83d] active:scale-[0.97]"
            >
              Search
            </button>
          </form>

          <nav aria-label="Browse by mood" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
            <span className="text-white/55">In the mood to</span>
            {MOODS.slice(0, 6).map((m) => (
              <Link key={m.slug} href={m.href} className="font-semibold text-white underline decoration-white/25 underline-offset-[6px] transition-colors hover:decoration-marigold">
                {m.label.toLowerCase()}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* the shelf */}
      <div className="relative mt-6 lg:mt-4">
        <div className="ak-shelf mx-auto max-w-7xl overflow-x-auto px-4 pt-16" style={{ scrollbarWidth: "none" }}>
          <ul className="flex min-w-max items-end gap-5 pl-4 sm:gap-6">
            {shelf.map((b, i) => (
              <motion.li
                key={b.slug}
                className="group relative shrink-0"
                style={{ transformOrigin: "bottom center" }}
                initial={reduce ? false : { y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1, rotate: LEAN.has(i) ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.25 + i * 0.045 }}
              >
                <Link href={`/book/${b.slug}`} aria-label={`${b.title} by ${b.author}, ${inr(b.price)}`} className="block">
                  <span className="pointer-events-none absolute -top-11 left-1/2 z-10 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-md bg-marigold px-2.5 py-1 text-[13px] font-bold text-ak-950 opacity-0 transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    {inr(b.price)}
                  </span>
                  <span className="ak-book block" style={{ height: bookHeight(b), ["--t" as string]: `${thickness(b)}px` }}>
                    <span className="ak-book-inner relative block h-full">
                      <img
                        src={b.cover!}
                        alt=""
                        width={Math.round(bookHeight(b) * 0.66)}
                        height={bookHeight(b)}
                        fetchPriority={i < 5 ? "high" : "auto"}
                        className="ak-book-cover block h-full w-auto object-cover"
                      />
                      <span aria-hidden="true" className="ak-book-spine" style={{ background: spineOf(b) }}>
                        <span className="ak-book-spine-text">{b.title}</span>
                      </span>
                    </span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
        {/* plank */}
        <div aria-hidden="true" className="relative h-5 bg-ak-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_30px_-12px_rgba(0,0,0,0.7)]" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 text-[14px] text-white/60">
          <span className="hidden sm:inline">Hover a book to see its price. Click to open it.</span>
          <span className="sm:hidden">Swipe the shelf</span>
          <Link href="/browse" className="font-semibold text-white transition-colors hover:text-marigold">
            Browse all books
          </Link>
        </div>
      </div>
    </section>
  );
}
