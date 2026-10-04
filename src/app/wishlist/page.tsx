"use client";

import { BOOKS } from "@/data/books";
import { useShop } from "@/lib/store";
import { BookCard, EmptyState } from "@/components/ui";
import { EMPTY_SHELF_IMAGE } from "@/data/taxonomy";

export default function WishlistPage() {
  const { wishlist } = useShop();
  const books = wishlist
    .map((slug) => BOOKS.find((b) => b.slug === slug))
    .filter((b) => b !== undefined);

  return (
    <div className="py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">Your Wishlist</h1>
      <p className="mt-1 text-sm text-muted">
        {books.length > 0 ? `${books.length} saved ${books.length === 1 ? "book" : "books"}` : "Nothing saved yet."}
      </p>
      {books.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          text="Tap the heart on any book to save it here."
          cta="Browse Books"
              image={EMPTY_SHELF_IMAGE}
          href="/browse"
        />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {books.map((b) => (
            <BookCard key={b!.slug} book={b!} />
          ))}
        </div>
      )}
    </div>
  );
}
