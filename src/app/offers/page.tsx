import Link from "next/link";
import { BOOKS, inr } from "@/data/books";
import { Price } from "@/components/ui";

function discount(b: { price: number; mrp: number }) {
  return b.mrp > b.price ? Math.round(((b.mrp - b.price) / b.mrp) * 100) : 0;
}

export default function OffersPage() {
  const books = BOOKS.filter((b) => b.mrp > b.price).sort(
    (a, b) => discount(b) - discount(a)
  );
  return (
    <main className="mx-auto max-w-7xl bg-white px-4 py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">Offers</h1>
      <p className="mt-1 text-sm text-muted">
        Honest discounts on new copies — biggest savings first.
      </p>
      <p className="tnum mt-3 text-sm text-muted">
        {books.length} {books.length === 1 ? "book" : "books"} on offer
      </p>
      <ul className="mt-4 space-y-2">
        {books.map((b) => (
          <li
            key={b.slug}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3 sm:gap-4 sm:p-4"
          >
            <Link
              href={`/book/${b.slug}`}
              className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-line bg-ak-50"
              aria-label={b.title}
              aria-hidden={false}
              tabIndex={-1}
            >
              {b.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-full w-full place-items-center font-display text-xl text-white"
                  style={{ backgroundColor: b.coverTint }}
                >
                  {b.title.charAt(0)}
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tnum rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-bold text-leaf">
                  {discount(b)}% off
                </span>
                <span className="tnum text-xs text-muted line-through">{inr(b.mrp)}</span>
              </div>
              <Link
                href={`/book/${b.slug}`}
                className="mt-1 block truncate text-[15px] font-bold text-ink hover:text-ak-800"
              >
                {b.title}
              </Link>
              <p className="truncate text-xs text-muted">{b.author}</p>
              <div className="mt-1">
                <Price value={b.price} mrp={b.mrp} />
              </div>
            </div>
            <Link
              href={`/book/${b.slug}`}
              className="shrink-0 rounded-lg bg-ak-800 px-6 py-3 text-[15px] font-bold text-white sm:px-6 sm:py-3.5 sm:text-[15px] transition-colors hover:bg-ak-900"
              aria-label={`View ${b.title}`}
            >
              View book
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
