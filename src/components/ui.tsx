"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { inr, type Book } from "@/data/books";
import { useShop } from "@/lib/store";
import { Press } from "./motion";
import { track } from "@/lib/analytics";

/* ---------- tiny drawn icon set, one 1.8px stroke ---------- */
const P = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Icon({ d, size = 20 }: { d: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...P} aria-hidden="true">
      {d}
    </svg>
  );
}

export const I = {
  heart: (f = false) => (
    <path d={f ? "M12 21s-7.5-4.9-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 11c0 5.1-7.5 10-7.5 10z" : "M12 20.5S4.5 15.6 4.5 10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3.5c0 5.1-7.5 10-7.5 10z"} fill={f ? "currentColor" : "none"} stroke={f ? "none" : "currentColor"} />
  ),
  cart: <><circle cx="9" cy="20" r="1.6" /><circle cx="17" cy="20" r="1.6" /><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></>,
  home: <><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10.5V20h12v-9.5" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5" /></>,
  pin: <><path d="M12 21s6.5-5.4 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.6 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.5 9.7l5.9-.9z" />,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
  chat: <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-5 4z" />,
};

/* ---------- price ---------- */
export function Price({ value, mrp, big = false }: { value: number; mrp?: number; big?: boolean }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`tnum font-bold text-ink ${big ? "text-3xl" : "text-[15px]"}`}>{inr(value)}</span>
      {mrp && mrp > value && (
        <>
          <span className={`tnum text-muted line-through ${big ? "text-lg" : "text-[13px]"}`}>{inr(mrp)}</span>
          <span className="tnum whitespace-nowrap rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-bold text-leaf">
            {Math.round(((mrp - value) / mrp) * 100)}% off
          </span>
        </>
      )}
    </span>
  );
}

/* ---------- rating ---------- */
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="flex items-center gap-1 text-[13px]">
      <span className="text-gold"><Icon size={14} d={I.star} /></span>
      <span className="tnum font-bold text-ink">{value.toFixed(1)}</span>
      {count !== undefined && <span className="tnum text-muted">({count.toLocaleString("en-IN")})</span>}
    </span>
  );
}

/* ---------- cover with authored fallback (optimized via next/image) ---------- */
export function Cover({ book, className = "", sizes }: { book: Book; className?: string; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  if (book.cover && !failed) {
    return (
      <span className="relative block aspect-[3/4] w-full overflow-hidden bg-ak-50">
        <Image
          src={book.cover}
          alt={`${book.title} cover`}
          fill
          sizes={sizes ?? "(max-width: 768px) 45vw, 220px"}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`object-cover ${className}`}
        />
      </span>
    );
  }
  return (
    <div
      className={`flex aspect-[3/4] w-full flex-col justify-between p-4 pt-11 text-white ${className}`}
      style={{ backgroundColor: book.coverTint }}
      role="img"
      aria-label={`${book.title} cover`}
    >
      <p className="font-display text-xl leading-[1.15] [text-wrap:balance]">{book.title}</p>
      <div>
        <div className="mb-2 h-px w-10 bg-white/60" />
        <p className="text-[11px] uppercase tracking-[0.14em] opacity-90">{book.author}</p>
      </div>
    </div>
  );
}

/* ---------- universal book card ---------- */
export function BookCard({ book }: { book: Book }) {
  const { toggleWish, isWished, addToCart } = useShop();
  const [added, setAdded] = useState(false);
  const wished = isWished(book.slug);
  const top = book.badges[0];
  const add = () => {
    addToCart(book.slug, 1);
    track("add_to_cart", { items: [{ item_id: book.slug, price: book.price, quantity: 1 }] });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };
  return (
    <div className="group relative flex flex-col">
      <Link
        href={`/book/${book.slug}`}
        className="relative block overflow-hidden rounded-xl bg-ak-50 shadow-[0_1px_2px_rgba(29,20,48,0.08)] transition-shadow duration-300 group-hover:shadow-[0_18px_30px_-16px_rgba(54,8,115,0.45)]"
        aria-label={`${book.title} by ${book.author}`}
      >
        <Cover book={book} className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
        {top && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold tracking-wider text-ak-800 shadow-sm">
            {top}
          </span>
        )}
      </Link>
      <span className="absolute right-2 top-2">
        <Press>
          <button
            type="button"
            onClick={() => toggleWish(book.slug)}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wished}
            className={`grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm transition-colors hover:text-ak-800 ${wished ? "text-ak-800" : "text-muted"}`}
          >
            <Icon size={17} d={I.heart(wished)} />
          </button>
        </Press>
      </span>
      <div className="flex flex-1 flex-col gap-0.5 pt-2.5">
        <Link href={`/book/${book.slug}`} className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink transition-colors hover:text-ak-800">
          {book.title}
        </Link>
        <p className="truncate text-[12.5px] text-muted">{book.author}</p>
        <div className="mb-2.5 mt-1">
          <Price value={book.price} mrp={book.mrp} />
        </div>
        <button
          type="button"
          onClick={add}
          aria-label={`Add ${book.title} to cart`}
          className={`mt-auto flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13.5px] font-bold transition-colors ${
            added ? "bg-leaf text-white" : "border border-ak-800/25 text-ak-800 hover:border-ak-800 hover:bg-ak-800 hover:text-white"
          }`}
        >
          <Icon size={15} d={added ? I.check : I.cart} />
          {added ? "Added" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

/* ---------- section heading ---------- */
export function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <h2 className="font-display text-[26px] leading-tight text-ink lg:text-[34px]">{title}</h2>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 pb-1 text-sm font-bold text-ak-800">
          View all <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={15} d={I.arrow} /></span>
        </Link>
      )}
    </div>
  );
}

/* ---------- empty state ---------- */
export function EmptyState({ title, text, cta, href, image }: { title: string; text: string; cta: string; href: string; image?: string | null }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-14 text-center">
      {image ? (
        <img src={image} alt="" loading="lazy" className="h-36 w-full rounded-xl border border-line object-cover" />
      ) : (
        <div className="grid h-14 w-14 place-items-center rounded-full bg-ak-50 text-ak-800">
          <Icon size={26} d={I.search} />
        </div>
      )}
      <h2 className="mt-2 font-display text-2xl text-ink">{title}</h2>
      <p className="text-sm text-muted">{text}</p>
      <Link href={href} className="mt-3 rounded-full bg-ak-800 px-6 py-2.5 text-sm font-bold text-white">
        {cta}
      </Link>
    </div>
  );
}
