"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Book } from "@/data/books";
import { inr } from "@/data/books";
import { CATEGORIES, EXAMS, MOODS } from "@/data/taxonomy";
import { BookCard, EmptyState } from "@/components/ui";
import { EMPTY_SHELF_IMAGE } from "@/data/taxonomy";

type SortKey = "relevance" | "price-asc" | "price-desc" | "newest" | "rating";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Rating" },
];

const PRICE_PRESETS = [199, 299, 499, 999];

function labelFor(list: { slug: string; label: string }[], slug: string) {
  return list.find((t) => t.slug === slug)?.label ?? slug;
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-line accent-[#4b0f8a]"
      />
      <span className="truncate">{label}</span>
    </label>
  );
}

export default function Listing({
  title,
  sub,
  books,
  showFilters = true,
}: {
  title: string;
  sub?: string;
  books: Book[];
  baseHref?: string;
  showFilters?: boolean;
}) {
  const [sort, setSort] = useState<SortKey>("relevance");
  const [cats, setCats] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [exams, setExams] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const toggle = (list: string[], v: string, set: (v: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const facets = useMemo(() => {
    const c = new Map<string, number>();
    const m = new Map<string, number>();
    const e = new Map<string, number>();
    const l = new Map<string, number>();
    let hi = 0;
    for (const b of books) {
      hi = Math.max(hi, b.price);
      for (const x of b.categories) c.set(x, (c.get(x) ?? 0) + 1);
      for (const x of b.moods) m.set(x, (m.get(x) ?? 0) + 1);
      for (const x of b.exams) e.set(x, (e.get(x) ?? 0) + 1);
      l.set(b.language, (l.get(b.language) ?? 0) + 1);
    }
    return {
      cats: [...c.entries()].sort((a, b) => b[1] - a[1]),
      moods: [...m.entries()].sort((a, b) => b[1] - a[1]),
      exams: [...e.entries()].sort((a, b) => b[1] - a[1]),
      langs: [...l.entries()].sort((a, b) => b[1] - a[1]),
      hi,
    };
  }, [books]);

  const filtered = useMemo(() => {
    let out = books.filter((b) => {
      if (cats.length && !b.categories.some((c) => cats.includes(c))) return false;
      if (moods.length && !b.moods.some((x) => moods.includes(x))) return false;
      if (exams.length && !b.exams.some((x) => exams.includes(x))) return false;
      if (langs.length && !langs.includes(b.language)) return false;
      if (maxPrice !== null && b.price > maxPrice) return false;
      if (inStockOnly && false) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        out = [...out].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        out = [...out].sort((a, b) => b.price - a.price);
        break;
      case "newest":
        out = [...out].sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      case "rating":
        out = [...out].sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    return out;
  }, [books, cats, moods, exams, langs, maxPrice, inStockOnly, sort]);

  const activeCount =
    cats.length + moods.length + exams.length + langs.length + (maxPrice !== null ? 1 : 0);

  const clearAll = () => {
    setCats([]);
    setMoods([]);
    setExams([]);
    setLangs([]);
    setMaxPrice(null);
    setInStockOnly(false);
  };

  const filterBody = (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Category</p>
        {facets.cats.map(([slug, n]) => (
          <CheckRow
            key={slug}
            label={`${labelFor(CATEGORIES, slug)} (${n})`}
            checked={cats.includes(slug)}
            onChange={() => toggle(cats, slug, setCats)}
          />
        ))}
      </div>
      {facets.moods.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Mood</p>
          {facets.moods.map(([slug, n]) => (
            <CheckRow
              key={slug}
              label={`${labelFor(MOODS, slug)} (${n})`}
              checked={moods.includes(slug)}
              onChange={() => toggle(moods, slug, setMoods)}
            />
          ))}
        </div>
      )}
      {facets.exams.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Exam</p>
          {facets.exams.map(([slug, n]) => (
            <CheckRow
              key={slug}
              label={`${labelFor(EXAMS, slug)} (${n})`}
              checked={exams.includes(slug)}
              onChange={() => toggle(exams, slug, setExams)}
            />
          ))}
        </div>
      )}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Language</p>
        {facets.langs.map(([slug, n]) => (
          <CheckRow
            key={slug}
            label={`${slug} (${n})`}
            checked={langs.includes(slug)}
            onChange={() => toggle(langs, slug, setLangs)}
          />
        ))}
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Availability</p>
        <CheckRow
          label="In Stock"
          checked={inStockOnly}
          onChange={() => setInStockOnly((v) => !v)}
        />
        <p className="mt-1 text-xs text-muted">All books shown are new, in-stock copies.</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Max Price</p>
        <input
          type="range"
          min={99}
          max={Math.max(facets.hi, 100)}
          step={10}
          value={maxPrice ?? Math.max(facets.hi, 100)}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#4b0f8a]"
          aria-label="Maximum price"
        />
        <p className="tnum text-sm font-semibold text-ink">
          {maxPrice !== null ? `Up to ${inr(maxPrice)}` : "Any price"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMaxPrice((v) => (v === p ? null : p))}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                maxPrice === p
                  ? "border-ak-800 bg-ak-800 text-white"
                  : "border-line bg-white text-ink"
              }`}
            >
              Under {inr(p)}
            </button>
          ))}
        </div>
        {maxPrice !== null && (
          <button type="button" onClick={() => setMaxPrice(null)} className="mt-2 text-xs font-bold text-ak-800">
            Clear price filter
          </button>
        )}
      </div>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="rounded-full border border-line px-4 py-2 text-xs font-bold text-ink"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="py-6">
      <h1 className="font-display text-3xl text-ink lg:text-4xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="tnum text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "book" : "books"}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex gap-6">
        {showFilters && (
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="rounded-xl border border-line bg-white p-4">{filterBody}</div>
          </aside>
        )}
        <div className="min-w-0 flex-1">
          {showFilters && (
            <details className="mb-4 rounded-xl border border-line bg-white p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-bold text-ink">
                Filters{activeCount > 0 ? ` (${activeCount})` : ""}
              </summary>
              <div className="mt-3 border-t border-line pt-3">{filterBody}</div>
            </details>
          )}
          {filtered.length === 0 ? (
            <EmptyState
              title="No books found"
              text="Try clearing a filter or two — or tell us what you are looking for."
              cta="Request a Book"
              image={EMPTY_SHELF_IMAGE}
              href="/request-book"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {filtered.map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <p className="mt-2 text-center text-sm">
              <Link href="/request-book" className="font-bold text-ak-800">
                Request this book
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
