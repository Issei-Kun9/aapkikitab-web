"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBook, inr } from "@/data/books";
import { useShop } from "@/lib/store";
import { Cover, EmptyState, Icon, Price } from "@/components/ui";
import { EMPTY_SHELF_IMAGE } from "@/data/taxonomy";
import { track } from "@/lib/analytics";

export default function CartPage() {
  const { cart, setQty, removeFromCart, subtotal } = useShop();
  const router = useRouter();
  const lines = cart
    .map((l) => ({ line: l, book: getBook(l.slug) }))
    .filter((x) => x.book !== undefined);

  if (lines.length === 0) {
    return (
      <div className="py-6">
        <h1 className="font-display text-3xl text-ink">Your Cart</h1>
        <EmptyState
          title="Your cart is empty"
          text="Every great library starts with a single book."
          cta="Browse Books"
              image={EMPTY_SHELF_IMAGE}
          href="/browse"
        />
      </div>
    );
  }

  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping;

  return (
    <div className="py-6">
      <h1 className="font-display text-3xl text-ink">Your Cart</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="flex flex-col gap-3">
          {lines.map(({ line, book }) => (
            <li
              key={line.slug}
              className="flex gap-3 rounded-xl border border-line bg-white p-3"
            >
              <Link href={`/book/${book!.slug}`} className="w-16 shrink-0 overflow-hidden rounded-lg">
                <Cover book={book!} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/book/${book!.slug}`}
                  className="line-clamp-2 text-sm font-semibold text-ink"
                >
                  {book!.title}
                </Link>
                <p className="truncate text-xs text-muted">{book!.author}</p>
                <div className="mt-1">
                  <Price value={book!.price} mrp={book!.mrp} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-line">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQty(line.slug, line.qty - 1)}
                      className="grid h-8 w-8 place-items-center text-ink"
                    >
                      <Icon size={14} d={<path d="M5 12h14" />} />
                    </button>
                    <span className="tnum w-7 text-center text-sm font-bold">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQty(line.slug, line.qty + 1)}
                      className="grid h-8 w-8 place-items-center text-ink"
                    >
                      <Icon size={14} d={<path d="M12 5v14M5 12h14" />} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.slug)}
                    className="text-xs font-bold text-muted hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="h-fit rounded-xl border border-line bg-white p-4 lg:sticky lg:top-4">
          <h2 className="font-display text-xl text-ink">Summary</h2>
          <dl className="mt-2 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tnum font-semibold">{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="tnum font-semibold">{shipping === 0 ? "Free" : inr(shipping)}</dd>
            </div>
            {shipping > 0 ? (
              <div className="mt-1">
                <div
                  className="h-2 overflow-hidden rounded-full bg-ak-100"
                  role="progressbar"
                  aria-valuenow={Math.round((subtotal / 499) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progress to free shipping"
                >
                  <div className="h-full rounded-full bg-ak-800" style={{ width: `${Math.min(100, (subtotal / 499) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs font-semibold text-ak-800">Add {inr(499 - subtotal)} more for FREE shipping.</p>
              </div>
            ) : (
              <p className="mt-1 text-xs font-bold text-leaf">You unlocked FREE shipping.</p>
            )}
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="tnum">{inr(total)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              track("begin_checkout", { value: subtotal, currency: "INR" });
              router.push("/checkout");
            }}
            className="mt-4 w-full rounded-full bg-ak-800 px-6 py-3 text-sm font-bold text-white"
          >
            PROCEED TO CHECKOUT
          </button>
          <p className="mt-2 text-center text-xs text-muted">100% Original · Easy 7-day returns · Secure UPI payment</p>
        </div>
      </div>
    </div>
  );
}
