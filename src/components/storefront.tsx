"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BOOKS, getBook, type Book } from "@/data/books";
import { GIFT_BOXES, PROMOS, SHOW } from "@/data/taxonomy";
import { BookCard, Cover, Icon, I, SectionHead, Solid } from "./ui";

const us = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

/* ---------- hero: lavender banner, one book standing on the right ---------- */
interface Slide {
  eyebrow: string;
  title: string;
  lines: string[];
  cta: string;
  href: string;
  book: Book;
  photo: string;
}

const HERO_MS = 5500;

export function HeroCarousel() {
  const lead = BOOKS.find((b) => b.bookOfDay) ?? BOOKS.find((b) => b.trending) ?? BOOKS[0];
  const slides: Slide[] = [
    {
      eyebrow: "Discover stories",
      title: "Books for a Better You",
      lines: ["Fiction | Self-Help | Academic", "Gifts | Art & Craft | Stationery"],
      cta: "Shop Now",
      href: "/browse",
      book: lead,
      photo: us("1512820790803-83ca734da794"),
    },
  ];
  if (SHOW("slider")) {
    for (const p of PROMOS) {
      const b = getBook(p.book);
      if (b && b.slug !== lead?.slug) {
        slides.push({ eyebrow: p.note, title: p.heading, lines: [`${p.lead} ${b.title}`], cta: p.cta, href: `/book/${b.slug}`, book: b, photo: p.photo });
      }
    }
  }
  const n = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  useEffect(() => {
    if (n <= 1 || paused) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), HERO_MS);
    return () => window.clearInterval(id);
  }, [n, paused]);
  if (!lead) return null;
  const go = (i: number) => setActive(((i % n) + n) % n);
  const s = slides[active];

  return (
    <div
      className="relative min-h-[300px] overflow-hidden rounded-3xl bg-[linear-gradient(100deg,#f3eeff_0%,#ebe3ff_45%,#ddd1ff_100%)] shadow-[0_18px_40px_-28px_rgba(46,18,143,0.55)] sm:min-h-[360px] lg:min-h-[440px]"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {/* photo on the right, fading into the lavender */}
      <img
        key={`p-${active}`}
        src={s.photo}
        alt=""
        className="ak-slide-photo absolute inset-y-0 right-0 h-full w-[58%] object-cover [mask-image:linear-gradient(to_right,transparent,#000_45%)] lg:w-[55%]"
      />
      <Link
        href={`/book/${s.book.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="ak-plinth absolute bottom-[14%] right-[7%] w-[34%] max-w-[250px] sm:right-[10%] sm:w-[26%] lg:right-[12%] lg:w-[22%]"
      >
        <span key={`b-${active}`} className="ak-card-book ak-hero-in block overflow-hidden rounded-[2px_5px_5px_2px] shadow-[14px_20px_36px_-12px_rgba(23,11,69,0.7)]">
          <Cover book={s.book} sizes="250px" />
        </span>
      </Link>

      <div key={`t-${active}`} className="ak-hero-in relative z-10 flex min-h-[inherit] max-w-[60%] flex-col justify-center px-5 py-8 sm:max-w-[55%] sm:px-10 lg:px-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ak-800 sm:text-[13px]">{s.eyebrow}</p>
        <h1 className="mt-3 font-display text-[30px] font-bold leading-[1.08] tracking-[-0.02em] text-ak-950 sm:text-[44px] lg:text-[58px]">
          {s.title}
        </h1>
        <div className="mt-3 space-y-0.5 text-[13px] text-ink/80 sm:text-[16px] lg:text-[18px]">
          {s.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <Link
          href={s.href}
          className="mt-6 inline-flex h-11 items-center gap-2 self-start rounded-full bg-ak-800 px-6 text-[15px] font-bold text-white shadow-[0_10px_20px_-10px_rgba(74,31,196,0.8)] transition-[background-color,transform] hover:bg-ak-900 active:scale-[0.97] sm:h-12 sm:px-7"
        >
          {s.cta}
          <Icon size={17} d={I.arrow} />
        </Link>
      </div>

      {n > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1} of ${n}`}
              aria-current={i === active}
              className={`h-2.5 rounded-full transition-[width,background-color] ${i === active ? "w-6 bg-ak-800" : "w-2.5 bg-ak-800/25 hover:bg-ak-800/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- round shortcuts under the hero ---------- */
const SHORTCUTS = [
  { label: "Books", icon: "books", href: "/browse" },
  { label: "Gifts", icon: "gifts", href: "/#gift-boxes" },
  { label: "Art & Craft", icon: "craft", href: "/art-craft" },
  { label: "Stationery", icon: "stationery", href: "/art-craft?type=notebooks" },
  { label: "Exams", icon: "exams", href: "/category/education-exams" },
  { label: "More", icon: "more", href: "/browse" },
];

export function CategoryCircles() {
  return (
    <nav aria-label="Shop by category" className="grid grid-cols-6 gap-1 sm:gap-4">
      {SHORTCUTS.map((c) => (
        <Link key={c.label} href={c.href} className="group flex flex-col items-center gap-2 text-center">
          <span className="grid aspect-square w-full max-w-[84px] place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#f7f3ff,#e6ddff)] text-ak-800 shadow-[0_6px_16px_-10px_rgba(46,18,143,0.5)] transition-[transform,background-color] duration-300 group-hover:-translate-y-1">
            <span className="scale-[0.85] sm:scale-110"><Solid name={c.icon} size={28} /></span>
          </span>
          <span className="text-[11.5px] font-semibold leading-tight text-ink sm:text-[14.5px]">{c.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/* ---------- reassurance strip ---------- */
const TRUST = [
  { icon: I.truck, title: "Free Delivery", sub: "Above ₹499" },
  { icon: I.shield, title: "Secure Payments", sub: "100% Safe" },
  { icon: I.box, title: "Easy Returns", sub: "7 Days" },
  { icon: I.headset, title: "Customer Support", sub: "Always Here", href: "/request-book" },
];

export function TrustStrip() {
  return (
    <ul className="grid grid-cols-4 divide-x divide-line rounded-2xl border border-line bg-white/80 py-3 sm:py-4">
      {TRUST.map((t) => (
        <li key={t.title} className="flex flex-col items-center gap-1.5 px-1 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
          <span className="shrink-0 text-ak-800"><Icon size={28} d={t.icon} /></span>
          <span className="leading-tight">
            <span className="block text-[11.5px] font-semibold text-ink sm:text-[15px]">{t.title}</span>
            <span className="block text-[10.5px] text-muted sm:text-[13px]">{t.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- two promo tiles ---------- */
export function PromoTiles() {
  const giftPhoto = GIFT_BOXES[0]?.photo ?? us("1512909006721-3d6018887383", 600);
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      <Link href="/trending" className="group relative flex h-[150px] items-center overflow-hidden rounded-2xl bg-peach sm:h-[200px] lg:h-[230px]">
        <img
          src={us("1495446815901-a7297e633e8d", 600)}
          alt=""
          loading="lazy"
          className="absolute inset-y-0 left-0 h-full w-[52%] object-cover transition-transform duration-700 [mask-image:linear-gradient(to_left,transparent,#000_40%)] group-hover:scale-[1.04]"
        />
        <span className="relative ml-auto w-[54%] pr-3 sm:pr-6">
          <span className="block font-display text-[18px] font-bold leading-[1.1] text-[#7b3a10] sm:text-[28px] lg:text-[34px]">Best Selling Books</span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink sm:mt-4 sm:text-[15px]">
            Explore Now
            <span className="transition-transform group-hover:translate-x-1"><Icon size={15} d={I.arrow} /></span>
          </span>
        </span>
      </Link>
      <Link href="/#gift-boxes" className="group relative flex h-[150px] items-center overflow-hidden rounded-2xl bg-[linear-gradient(110deg,#efe8ff,#e0d4ff)] sm:h-[200px] lg:h-[230px]">
        <img
          src={giftPhoto}
          alt=""
          loading="lazy"
          className="absolute inset-y-0 right-0 h-full w-[50%] object-cover transition-transform duration-700 [mask-image:linear-gradient(to_right,transparent,#000_40%)] group-hover:scale-[1.04]"
        />
        <span className="relative w-[58%] pl-3 sm:pl-6">
          <span className="block font-display text-[18px] font-bold leading-[1.1] text-ak-900 sm:text-[28px] lg:text-[34px]">Unique Gifts</span>
          <span className="mt-1 block text-[11.5px] text-ink/75 sm:text-[14px]">For Every Occasion</span>
          <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink sm:mt-3 sm:text-[15px]">
            Shop Now
            <span className="transition-transform group-hover:translate-x-1"><Icon size={15} d={I.arrow} /></span>
          </span>
        </span>
      </Link>
    </div>
  );
}

/* ---------- product rails ---------- */
export function ProductRail({ title, href, books }: { title: string; href: string; books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <div>
      <SectionHead title={title} href={href} />
      <div className="ak-prod-rail">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
    </div>
  );
}

const coverFirst = (list: Book[]) => [...list.filter((b) => b.cover), ...list.filter((b) => !b.cover)];

export function BestSellers() {
  const ranked = BOOKS.filter((b) => b.trending);
  return <ProductRail title="Best Sellers" href="/trending" books={ranked.slice(0, 12)} />;
}

export function NewArrivals() {
  const fresh = BOOKS.filter((b) => b.isNew);
  const fill = coverFirst(BOOKS.filter((b) => !b.isNew));
  return <ProductRail title="New Arrivals" href="/new" books={[...fresh, ...fill].slice(0, 12)} />;
}
