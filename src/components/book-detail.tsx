"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Book } from "@/data/books";
import type { Store } from "@/data/taxonomy";
import { useShop } from "@/lib/store";
import { BookCard, Cover, Icon, I, Price, Rating } from "@/components/ui";
import { motionTokens, springs } from "@/lib/motion-tokens";
import { track } from "@/lib/analytics";

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

  const buyNow = () => {
    addToCart(book.slug, qty);
    track("begin_checkout", { items: [{ item_id: book.slug, price: book.price, quantity: qty }] });
    router.push("/checkout");
  };

  return (
    <div className="py-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <Cover book={book} sizes="(max-width: 1024px) 90vw, 480px" />
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
          <h1 className="mt-2 font-display text-3xl leading-tight text-ink lg:text-4xl">{book.title}</h1>
          <p className="mt-1 text-sm text-muted">by {book.author}</p>
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

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-line">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center text-ink"
              >
                <Icon size={16} d={<path d="M5 12h14" />} />
              </button>
              <span className="tnum w-8 text-center font-bold">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(9, q + 1))}
                className="grid h-10 w-10 place-items-center text-ink"
              >
                <Icon size={16} d={<path d="M12 5v14M5 12h14" />} />
              </button>
            </div>
            <motion.button
              type="button"
              onClick={() => {
                addToCart(book.slug, qty);
                track("add_to_cart", { items: [{ item_id: book.slug, price: book.price, quantity: qty }] });
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1400);
              }}
              whileTap={{ scale: motionTokens.scale.press }}
              transition={springs.snappy}
              className={`flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold text-white ${added ? "bg-leaf" : "bg-ak-800"}`}
            >
              {added && <Icon size={15} d={I.check} />}
              {added ? "ADDED" : "ADD TO CART"}
            </motion.button>
            <button
              type="button"
              onClick={buyNow}
              className="rounded-full border border-ak-800 px-6 py-2.5 text-sm font-bold text-ak-800"
            >
              BUY NOW
            </button>
            <button
              type="button"
              onClick={() => toggleWish(book.slug)}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wished}
              className={`grid h-10 w-10 place-items-center rounded-full border border-line ${
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
          <p className="mt-3 text-sm text-muted">Free shipping above ₹499 · COD available · Easy 7-day returns</p>

          <div className="mt-5 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Author", book.author],
                  ["Publisher", book.publisher],
                  ["ISBN", book.isbn ?? "—"],
                  ["Language", book.language],
                  ["Pages", String(book.pages)],
                  ["Edition", book.edition],
                  ["Genre", book.genre],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-line last:border-0">
                    <td className="w-32 bg-ak-50/50 px-4 py-2 font-semibold text-muted">{k}</td>
                    <td className="px-4 py-2 text-ink">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5">
            <h2 className="font-display text-xl text-ink">About the Book</h2>
            <p className="ak-prose mt-1 text-ink/80">{book.blurb}</p>
          </div>

          {store && (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
              <div>
                <p className="text-sm font-bold text-ink">{store.name}</p>
                <p className="text-xs text-muted">{store.location}</p>
              </div>
              <Link
                href={`/store/${store.slug}`}
                className="rounded-full border border-ak-800 px-4 py-2 text-xs font-bold text-ak-800"
              >
                VIEW STORE
              </Link>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-[22px] text-ink">Related Books</h2>
          <div className="ak-rail">
            {related.map((b) => (
              <BookCard key={b.slug} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
