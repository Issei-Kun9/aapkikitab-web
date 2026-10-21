"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Listing from "@/components/listing";
import { searchBooks } from "@/data/books";

function SearchBody() {
  const q = useSearchParams().get("q") ?? "";
  const results = searchBooks(q);
  if (!q.trim()) {
    return (
      <div className="py-6">
        <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">Search</h1>
        <p className="mt-1 text-sm text-muted">Type a title, author or ISBN in the search bar above.</p>
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <div className="py-6">
        <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">No results for &ldquo;{q}&rdquo;</h1>
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-white p-6 text-center">
          <h2 className="font-display font-bold text-2xl text-ink">Can&apos;t Find Your Book?</h2>
          <p className="mt-2 text-sm text-muted">
            Tell us what you&apos;re looking for and we&apos;ll try to arrange it.
          </p>
          <Link
            href="/request-book"
            className="mt-4 inline-block rounded-lg bg-ak-800 px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-ak-900"
          >
            Request this book
          </Link>
        </div>
      </div>
    );
  }
  return (
    <Listing
      title={`Results for "${q}"`}
      sub={`${results.length} ${results.length === 1 ? "book" : "books"} found`}
      books={results}
      showFilters={false}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchBody />
    </Suspense>
  );
}
