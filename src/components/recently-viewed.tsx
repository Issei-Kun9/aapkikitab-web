"use client";

import { useEffect, useState } from "react";
import { getBook, type Book } from "@/data/books";
import { BookCard, SectionHead } from "@/components/ui";

export const RECENT_KEY = "ak_recent";
const MAX_RECENT = 10;

export function readRecentSlugs(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** Order-preserving, deduped recorder. Newest first, capped at 10. */
export function recordRecentView(slug: string) {
  try {
    const next = [slug, ...readRecentSlugs().filter((s) => s !== slug)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — browsing still works */
  }
}

export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const slugs = readRecentSlugs().filter((s) => s !== excludeSlug);
    const found: Book[] = [];
    for (const s of slugs) {
      const b = getBook(s);
      if (b) found.push(b);
    }
    setBooks(found);
  }, [excludeSlug]);

  if (books.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-8">
      <SectionHead title="Recently Viewed" />
      <h2 id="recently-viewed-heading" className="sr-only">
        Recently Viewed
      </h2>
      <div className="ak-rail">
        {books.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
    </section>
  );
}
