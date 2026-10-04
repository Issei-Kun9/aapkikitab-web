"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Book } from "@/data/books";
import type { Store } from "@/data/taxonomy";
import { CATEGORIES } from "@/data/taxonomy";
import { useShop } from "@/lib/store";
import { BookCard, Cover, Icon, I, Price, Rating } from "@/components/ui";
import { Reviews } from "@/components/reviews";
import { RecentlyViewed, recordRecentView } from "@/components/recently-viewed";
import { track } from "@/lib/analytics";

/* Native disclosure: keyboard + screen-reader support for free, no JS. */
function Section({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group/acc border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[15px] font-bold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-muted transition-transform duration-300 group-open/acc:rotate-45">
          <Icon size={18} d={I.plus} />
        </span>
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

export default function BookDetail({
  book,
  store,
  related,
}: {
  book: Book;
  store: Store | undefined;
  related: Book[];
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart, toggleWish, isWished } = useShop();
  const router = useRouter();
  const wished = isWished(book.slug);

  /* Sticky mobile buy bar: appears once the primary CTA row leaves the viewport. */
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaHidden, setCtaHidden] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaHidden(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addOne = () => {
    addToCart(book.slug, qty);
    track("add_to_cart", { items: [{ item_id: book.slug, price: book.price, quantity: qty }] });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };


  /* Recently viewed: order-preserving, deduped, capped at 10. */
  useEffect(() => {
    recordRecentView(book.slug);
  }, [book.slug]);

  const buyNow = () => {
    addToCart(book.slug, qty);
    track("begin_checkout", { items: [{ item_id: book.slug, price: book.price, quantity: qty }] });
    router.push("/checkout");
  };

  const categorySlug = book.categories[0];
  const category = CATEGORIES.find((c) => c.slug === categorySlug);

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13.5px] text-muted">
          <li><Link href="/" className="hover:text-ak-800">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={book.kind === "craft" ? "/art-craft" : category?.href ?? "/browse"} className="hover:text-ak-800">
              {book.kind === "craft" ? "Art & craft" : category?.label ?? (book.genre || "Books")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate font-semibold text-ink">{book.title}</li>
        </ol>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Gallery: ak-50 shelf band behind on lg, soft offset + blur shadow under cover */}
        <div className="relative mx-auto w-full max-w-[260px] lg:max-w-none">
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_40px_-20px_rgba(54,8,115,0.45)]">
              <Cover book={book} sizes="(max-width: 1024px) 90vw, 480px" />
            </div>
            <div aria-hidden="true" className="mx-8 mt-2 h-4 rounded-full bg-ink/10 blur-md" />
          </div>
        </div>
        <div>
          <div className="flex flex-wrap gap-1.5">
            {book.isNew && (
              <span className="rounded-full bg-ak-800 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white">
                NEW
              </span>
            )}
            {book.badges.map((b) => (
              <span
                key={b}
                className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-ak-800"
              >
                {b}
              </span>
            ))}
          </div>
          <h1 className="mt-2 font-display text-[32px]! leading-[1.1]! text-ink lg:text-[44px]!">{book.title}</h1>
          {book.kind !== "craft" && <p className="mt-1 text-sm text-muted">by {book.author}</p>}
          <div className="mt-2">
            <Rating value={book.rating} count={book.reviews} />
          </div>
          <div className="mt-3">
            <Price value={book.price} mrp={book.mrp} big />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-leaf">
            <Icon size={15} d={<path d="m5 12.5 4.5 4.5L19 7.5" />} /> In Stock
          </p>
          <p className="text-xs text-muted">New Copy · Verified Physical Bookstore</p>

          <div ref={ctaRef} className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex sm:flex-wrap">
            <div className="flex items-center rounded-full border border-line">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-12 w-9 place-items-center text-ink sm:w-11"
              >
                <Icon size={16} d={<path d="M5 12h14" />} />
              </button>
              <span className="tnum w-7 text-center font-bold sm:w-8">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(9, q + 1))}
                className="grid h-12 w-9 place-items-center text-ink sm:w-11"
              >
                <Icon size={16} d={<path d="M12 5v14M5 12h14" />} />
              </button>
            </div>
            <button
                type="button"
                onClick={addOne}
                className={`flex h-12 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 sm:px-7 transition-transform active:scale-[0.97] sm:w-auto text-[15px] font-bold text-white transition-colors ${added ? "bg-leaf" : "bg-ak-800 hover:bg-ak-900"}`}
              >
                <span className="hidden min-[400px]:inline"><Icon size={16} d={added ? I.check : I.cart} /></span>
                {added ? "Added" : "Add to cart"}
              </button>
            <button
              type="button"
              onClick={buyNow}
              className="order-last col-span-3 h-12 rounded-full border border-ak-800 px-7 text-[15px] font-bold text-ak-800 transition-colors hover:bg-ak-50 sm:order-none"
            >
              Buy now
            </button>
            <button
              type="button"
              onClick={() => toggleWish(book.slug)}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wished}
              className={`grid h-12 w-12 place-items-center rounded-full border border-line transition-colors hover:text-ak-800 ${
                wished ? "text-ak-800" : "text-muted"
              }`}
            >
              <Icon
                size={18}
                d={
                  <path
                    d="M12 21s-7.5-4.9-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 11c0 5.1-7.5 10-7.5 10z"
                    fill={wished ? "currentColor" : "none"}
                    stroke={wished ? "none" : "currentColor"}
                  />
                }
              />
            </button>
          </div>
          <ul className="mt-4 grid max-w-md grid-cols-3 gap-2 text-center text-[12.5px] font-semibold text-ink">
            {["Free shipping over ₹499", "Cash on delivery", "7-day returns"].map((t) => (
              <li key={t} className="rounded-xl bg-ak-50 px-2 py-2.5 leading-tight">{t}</li>
            ))}
          </ul>

          <div className="mt-6 border-t border-line">
            <Section title={book.kind === "craft" ? "About this item" : "About the book"} open>
              <p className="ak-prose text-ink/80">{book.blurb}</p>
            </Section>
            {book.kind !== "craft" && (

            <Section title="Details">
              <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
                {[
                  ["Author", book.author],
                  ["Publisher", book.publisher],
                  ["ISBN", book.isbn ?? "—"],
                  ["Language", book.language],
                  ["Pages", String(book.pages)],
                  ["Edition", book.edition],
                  ["Genre", book.genre],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k}</dt>
                    <dd className="tnum text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>)}
            <Section title="Sold by">
              {store ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{store.name}</p>
                    <p className="text-xs text-muted">{store.location}</p>
                  </div>
                  <Link
                    href={`/store/${store.slug}`}
                    className="rounded-full border border-ak-800 px-4 py-2 text-xs font-bold text-ak-800 transition-colors hover:bg-ak-50"
                  >
                    View store
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted">Sold by an Aapki Kitab verified physical bookstore.</p>
              )}
            </Section>
            <Section title="Shipping & returns">
              <ul className="tnum space-y-1.5 text-sm text-ink/80">
                <li>Dispatched within 24–48 hours.</li>
                <li>Flat ₹49 shipping; free on orders above ₹499.</li>
                <li>7-day replacement for damaged or wrong-title deliveries.</li>
              </ul>
            </Section>
          </div>
        </div>
      </div>

      <Reviews book={book} />

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-5 font-display text-[26px] font-bold text-ink lg:text-[34px]">You may also like</h2>
          <div className="ak-rail">
            {related.map((b) => (
              <BookCard key={b.slug} book={b} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeSlug={book.slug} />

      <AnimatePresence>
        {ctaHidden && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white px-4 py-2.5 shadow-[0_-8px_24px_-12px_rgba(29,20,48,0.25)] lg:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{book.title}</p>
                <Price value={book.price} mrp={book.mrp} />
              </div>
              <button
                type="button"
                onClick={addOne}
                className={`h-11 shrink-0 rounded-full px-5 text-sm font-bold text-white ${added ? "bg-leaf" : "bg-ak-800"}`}
              >
                {added ? "Added" : "Add to cart"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
