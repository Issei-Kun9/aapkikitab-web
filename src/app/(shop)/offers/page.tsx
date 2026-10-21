import type { Metadata } from "next";
import { BOOKS, CRAFT } from "@/data/books";
import { BookCard, CraftCard } from "@/components/ui";

const pctOff = (price: number, mrp: number) => Math.round(((mrp - price) / mrp) * 100);

export const metadata: Metadata = {
  title: "Offers — Aapki Kitab",
  description: "Honest discounts on new books and art & craft, biggest savings first.",
};

export default function OffersPage() {
  const byDiscount = <T extends { price: number; mrp: number }>(list: T[]) =>
    list.filter((b) => b.mrp > b.price).sort((a, b) => pctOff(b.price, b.mrp) - pctOff(a.price, a.mrp));
  const books = byDiscount(BOOKS);
  const craft = byDiscount(CRAFT);
  return (
    <div className="py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">Offers</h1>
      <p className="mt-1 text-[15px] text-muted">Honest discounts on new copies, biggest savings first.</p>
      <p className="tnum mt-3 text-sm text-muted">
        {books.length + craft.length} {books.length + craft.length === 1 ? "item" : "items"} on offer
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
      {craft.length > 0 && (
        <>
          <h2 className="mt-10 text-[20px] font-bold text-ink sm:text-[24px]">Art &amp; craft offers</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
            {craft.map((c) => (
              <CraftCard key={c.slug} item={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
