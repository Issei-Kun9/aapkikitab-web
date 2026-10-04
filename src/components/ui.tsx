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
  truck: <><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  store: <><path d="M4 9h16l-1.5-5h-13z" /><path d="M5 9v11h14V9" /><path d="M10 20v-6h4v6" /></>,
  headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  gift: <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zm0 0s1.5-4.5 4-3.5S15 8 12 8z" /></>,
};

/* ---------- solid glyphs for the round category tiles ---------- */
export const SOLID: Record<string, ReactNode> = {
  books: <path d="M6 3h11a2 2 0 0 1 2 2v13H7.5a1.5 1.5 0 0 0 0 3H19v-1.5h1V22H7.5A3.5 3.5 0 0 1 4 18.5V5a2 2 0 0 1 2-2zm2.5 4v2h7V7zm0 4v2h5v-2z" />,
  gifts: <path d="M9 2.5c1.3 0 2.4.8 3 2 .6-1.2 1.7-2 3-2a3 3 0 0 1 2.6 4.5H21a1 1 0 0 1 1 1V11a1 1 0 0 1-1 1h-8V7h-2v5H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3.4A3 3 0 0 1 9 2.5zm0 2a1 1 0 0 0 0 2.5h2C10.8 5.5 10 4.5 9 4.5zm6 0c-1 0-1.8 1-2 2.5h2a1 1 0 0 0 0-2.5zM3.5 13.5H11V22H5a1.5 1.5 0 0 1-1.5-1.5zm9.5 0h7.5v7A1.5 1.5 0 0 1 19 22h-6z" />,
  craft: <path d="M12 2.5C6.5 2.5 2.5 6.6 2.5 11.6c0 4.6 3.7 8.9 8.4 8.9 1.6 0 2.3-.9 2.3-1.9 0-1.3-1-1.6-1-2.7 0-1 .8-1.7 1.9-1.7h2.3c3 0 5.1-2.2 5.1-5C21.5 5.6 17.3 2.5 12 2.5zM7 12.2a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm3-4a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm4.6 0a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2zm3 3.6a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2z" />,
  stationery: <path d="M16.2 2.8a2.4 2.4 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4L9.4 19.6 3 21l1.4-6.4zM5.9 15.8l-.6 2.9 2.9-.6z" />,
  decor: <path d="M12 2.6 22 11h-2.6v9.4a1 1 0 0 1-1 1H14v-6h-4v6H5.6a1 1 0 0 1-1-1V11H2z" />,
  more: <path d="m12 2.5 2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" />,
  exams: <path d="M12 3 1.5 8.5 12 14l8.5-4.4V16h2V8.5zM5.5 12.6v3.9C7.2 18.4 9.5 19.5 12 19.5s4.8-1.1 6.5-3V12.6L12 16z" />,
};

export function Solid({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {SOLID[name] ?? SOLID.more}
    </svg>
  );
}

/* ---------- price ---------- */
export function Price({ value, mrp, big = false }: { value: number; mrp?: number; big?: boolean }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`tnum font-bold text-ink ${big ? "text-3xl" : "text-[15px]"}`}>{inr(value)}</span>
      {mrp && mrp > value && (
        <>
          <span className={`tnum text-muted line-through ${big ? "text-lg" : "text-[13px]"}`}>{inr(mrp)}</span>
          <span className="tnum whitespace-nowrap rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose">
            {Math.round(((mrp - value) / mrp) * 100)}% OFF
          </span>
        </>
      )}
    </span>
  );
}

/* ---------- rating ---------- */
export function Rating({ value, count }: { value: number; count?: number }) {
  if (!value || count === 0) return <span className="text-[13px] text-muted">No ratings yet</span>;
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
  /* Authored placeholder: a designed jacket, not a flat swatch. The wrapper is the size
     container, so every measurement inside scales with the jacket's own width. */
  return (
    <div className={`w-full [container-type:inline-size] ${className}`} role="img" aria-label={`${book.title} cover`}>
      <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-between overflow-hidden bg-ak-900 px-[9cqw] py-[11cqw] text-center text-white">
        <span aria-hidden="true" className="absolute inset-[4.5cqw] rounded-[3px] border border-white/25" />
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[4.5cqw] bg-ak-950/60" />
        <img src="/logo.webp" alt="" aria-hidden="true" className="relative h-[14cqw] w-[14cqw] opacity-90" />
        <p className="relative font-display text-[11cqw] font-bold leading-[1.1] [text-wrap:balance]">{book.title}</p>
        <div className="relative">
          <div className="mx-auto mb-[4cqw] h-px w-[16cqw] bg-white/50" />
          <p className="text-[5cqw] font-semibold uppercase tracking-[0.16em] text-ak-100">{book.author}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- discount pill + compact price row for product cards ---------- */
export const pctOff = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

function CardPrice({ price, mrp }: { price: number; mrp: number }) {
  const off = pctOff(price, mrp);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="tnum text-[14px] font-bold text-ink sm:text-[16px]">{inr(price)}</span>
      {off > 0 && <span className="tnum text-[11.5px] text-muted line-through sm:text-[13px]">{inr(mrp)}</span>}
      {off > 0 && (
        <span className="tnum whitespace-nowrap rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose sm:ml-auto sm:px-2 sm:text-[11px]">
          {off}% OFF
        </span>
      )}
    </div>
  );
}

function AddButton({ label, onAdd }: { label: string; onAdd: () => void }) {
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        onAdd();
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
      aria-label={`Add ${label} to cart`}
      className={`mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold text-white transition-[background-color,transform] active:scale-[0.97] sm:h-10 sm:text-[14px] ${
        added ? "bg-leaf" : "bg-ak-800 hover:bg-ak-900"
      }`}
    >
      <Icon size={15} d={added ? I.check : I.cart} />
      {added ? "Added" : "Add to Cart"}
    </button>
  );
}

function WishButton({ slug }: { slug: string }) {
  const { toggleWish, isWished } = useShop();
  const wished = isWished(slug);
  return (
    <span className="absolute right-1.5 top-1.5 z-10">
      <Press>
        <button
          type="button"
          onClick={() => toggleWish(slug)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className={`grid h-8 w-8 place-items-center rounded-full bg-white/90 transition-colors hover:text-ak-800 ${wished ? "text-rose" : "text-ak-800"}`}
        >
          <Icon size={19} d={I.heart(wished)} />
        </button>
      </Press>
    </span>
  );
}

/* ---------- universal book card: white card, cover up top, one purple buy button ---------- */
export function BookCard({ book }: { book: Book }) {
  const { addToCart } = useShop();
  const add = () => {
    addToCart(book.slug, 1);
    track("add_to_cart", { items: [{ item_id: book.slug, price: book.price, quantity: 1 }] });
  };
  return (
    <div className="ak-card group relative flex flex-col rounded-2xl p-2 sm:p-3">
      <WishButton slug={book.slug} />
      <Link
        href={`/book/${book.slug}`}
        aria-label={`${book.title} by ${book.author}`}
        className="flex justify-center rounded-xl px-[12%] pb-1 pt-2"
      >
        <span className="block w-full overflow-hidden rounded-[2px_4px_4px_2px] shadow-[4px_6px_14px_-6px_rgba(23,11,69,0.45)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
          <Cover book={book} sizes="(max-width: 640px) 30vw, 200px" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col pt-2">
        <Link href={`/book/${book.slug}`} className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink transition-colors hover:text-ak-800 sm:text-[15px]">
          {book.title}
        </Link>
        <p className="mt-0.5 truncate text-[11.5px] text-muted sm:text-[13px]">{book.author}</p>
        <div className="mt-auto">
          <CardPrice price={book.price} mrp={book.mrp} />
          <AddButton label={book.title} onAdd={add} />
        </div>
      </div>
    </div>
  );
}

/* ---------- art & craft card: same card, square photo ---------- */
export function CraftCard({ item }: { item: Book }) {
  const { addToCart } = useShop();
  const add = () => {
    addToCart(item.slug, 1);
    track("add_to_cart", { items: [{ item_id: item.slug, price: item.price, quantity: 1 }] });
  };
  return (
    <div className="ak-card group relative flex flex-col rounded-2xl p-2 sm:p-3">
      <WishButton slug={item.slug} />
      <Link href={`/book/${item.slug}`} className="relative block overflow-hidden rounded-xl bg-ak-50" aria-label={item.title}>
        {item.cover ? (
          <img src={item.cover} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
        ) : (
          <span className="grid aspect-square place-items-center font-display text-4xl text-ak-800">{item.title.charAt(0)}</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-2">
        <Link href={`/book/${item.slug}`} className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink transition-colors hover:text-ak-800 sm:text-[15px]">
          {item.title}
        </Link>
        <div className="mt-auto">
          <CardPrice price={item.price} mrp={item.mrp} />
          <AddButton label={item.title} onAdd={add} />
        </div>
      </div>
    </div>
  );
}

/* ---------- section heading ---------- */
export function SectionHead({ title, href, sub }: { title: string; href?: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 lg:mb-5">
      <div className="min-w-0">
        <h2 className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-ink sm:text-[24px] lg:text-[28px]">{title}</h2>
        {sub && <p className="mt-0.5 text-[14.5px] text-muted">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 pb-0.5 text-[14.5px] font-bold text-ak-800">
          View All
          <span className="transition-transform duration-300 group-hover:translate-x-1"><Icon size={15} d={I.arrow} /></span>
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
