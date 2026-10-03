"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import type { Book } from "@/data/books";
import type { Store } from "@/data/taxonomy";
import { CATEGORIES } from "@/data/taxonomy";
import { useShop } from "@/lib/store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BookCard, Cover, Icon, I, Price, Rating } from "@/components/ui";
import { Press } from "@/components/motion";
import { Reviews } from "@/components/reviews";
import { RecentlyViewed, recordRecentView } from "@/components/recently-viewed";
import { track } from "@/lib/analytics";

function accordionTrigger(label: string) {
  return <span className="text-[15px] font-bold text-ink">{label}</span>;
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

  /* First accordion open by default on desktop widths only (mobile: all collapsed). */
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [aboutOpen, setAboutOpen] = useState(false);
  useEffect(() => {
    setAboutOpen(isDesktop);
  }, [isDesktop]);

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
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        {category ? (
          <BreadcrumbItem href={category.href}>{category.label}</BreadcrumbItem>
        ) : (
          <BreadcrumbItem href="/browse">{book.genre}</BreadcrumbItem>
        )}
        <BreadcrumbItem isCurrent>{book.title}</BreadcrumbItem>
      </Breadcrumbs>

      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Gallery: ak-50 shelf band behind on lg, soft offset + blur shadow under cover */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-x-[-1rem] bottom-0 top-1/3 hidden rounded-2xl bg-ak-50 lg:block"
          />
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[6px_6px_0_0_#EDE6F9]">
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
            <Press>
              <button
                type="button"
                onClick={() => {
                  addToCart(book.slug, qty);
                  track("add_to_cart", { items: [{ item_id: book.slug, price: book.price, quantity: qty }] });
                  setAdded(true);
                  window.setTimeout(() => setAdded(false), 1400);
                }}
                className={`flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-bold text-white ${added ? "bg-leaf" : "bg-ak-800"}`}
              >
                {added && <Icon size={15} d={I.check} />}
                {added ? "ADDED" : "ADD TO CART"}
              </button>
            </Press>
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

          <div className="mt-5 space-y-2">
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <Collapsible
                trigger={accordionTrigger("About the Book")}
                isOpen={aboutOpen}
                onOpenChange={setAboutOpen}
              >
                <p className="ak-prose px-4 pb-4 text-ink/80">{book.blurb}</p>
              </Collapsible>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <Collapsible trigger={accordionTrigger("Details")}>
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
                <div className="pb-2" />
              </Collapsible>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <Collapsible trigger={accordionTrigger("Verified Store")}>
                {store ? (
                  <div className="flex items-center justify-between gap-3 px-4 pb-4">
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
                ) : (
                  <p className="px-4 pb-4 text-sm text-muted">
                    Sold by an Aapki Kitab verified physical bookstore.
                  </p>
                )}
              </Collapsible>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <Collapsible trigger={accordionTrigger("Shipping & Returns")}>
                <ul className="tnum space-y-1.5 px-4 pb-4 text-sm text-ink/80">
                  <li>Dispatched within 24–48 hours.</li>
                  <li>Flat ₹49 shipping; free on orders above ₹499.</li>
                  <li>7-day replacement for damaged or wrong-title deliveries.</li>
                </ul>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>

      <Reviews book={book} />

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

      <RecentlyViewed excludeSlug={book.slug} />
    </div>
  );
}
