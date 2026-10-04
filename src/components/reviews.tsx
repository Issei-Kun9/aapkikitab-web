"use client";

import { useEffect, useMemo, useState } from "react";
import type { Book } from "@/data/books";
import { Icon, I } from "@/components/ui";

interface UserReview {
  name: string;
  stars: number;
  text: string;
  date: string;
}

const STORAGE_KEY = "ak_reviews";

function readAll(): Record<string, UserReview[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") return parsed as Record<string, UserReview[]>;
    return {};
  } catch {
    return {};
  }
}

/**
 * Deterministic 5→1 distribution derived ONLY from the average rating.
 * Bell weight around the rating value, normalized to percentages.
 * Displayed as an illustrative "rating snapshot", never as real per-star counts.
 */
function snapshotDistribution(rating: number): { star: number; pct: number }[] {
  const weights = [5, 4, 3, 2, 1].map((s) => Math.exp(-((s - rating) ** 2) / 0.8));
  const total = weights.reduce((n, w) => n + w, 0);
  return [5, 4, 3, 2, 1].map((star, i) => ({
    star,
    pct: Math.round((weights[i] / total) * 100),
  }));
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={n <= value ? "text-gold" : "text-line"}
        >
          <Icon size={22} d={I.star} />
        </button>
      ))}
    </div>
  );
}

export function Reviews({ book }: { book: Book }) {
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [name, setName] = useState("");
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    setUserReviews(readAll()[book.slug] ?? []);
  }, [book.slug]);

  const bars = useMemo(() => snapshotDistribution(book.rating), [book.rating]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || stars === 0 || !text.trim()) {
      setError("Please add your name, a star rating and a few words.");
      return;
    }
    const entry: UserReview = {
      name: name.trim().slice(0, 60),
      stars,
      text: text.trim().slice(0, 2000),
      date: new Date().toISOString(),
    };
    try {
      const all = readAll();
      const next = [...(all[book.slug] ?? []), entry];
      all[book.slug] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setUserReviews(next);
    } catch {
      setError("Could not save your review on this device. Please try again.");
      return;
    }
    setError(null);
    setName("");
    setStars(0);
    setText("");
    setThanks(true);
    window.setTimeout(() => setThanks(false), 2500);
  };

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mt-8 scroll-mt-40">
      <h2 id="reviews-heading" className="mb-3 font-display text-[22px] text-ink">
        Ratings & Reviews
      </h2>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Aggregate panel: real average + real count, illustrative bars */}
        <div className="rounded-xl border border-line bg-white p-5">
          <p className="text-sm font-bold text-ink">Rating snapshot</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="tnum font-display text-5xl text-ink">{book.rating.toFixed(1)}</span>
            <span className="text-gold">
              <Icon size={18} d={I.star} />
            </span>
          </p>
          <p className="tnum mt-1 text-sm text-muted">
            {book.reviews.toLocaleString("en-IN")} verified ratings
          </p>
          <div className="mt-4 space-y-1.5" aria-label="Illustrative rating distribution">
            {bars.map((b) => (
              <div key={b.star} className="flex items-center gap-2">
                <span className="tnum w-3 text-xs font-bold text-ink">{b.star}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ak-50">
                  <div className="h-full rounded-full bg-ak-800" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="tnum w-9 text-right text-xs text-muted">{b.pct}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Bars illustrate the average rating; they are not individual reviews.
          </p>
        </div>

        {/* Write a review + reader reviews (local only, never seeded) */}
        <div className="rounded-xl border border-line bg-white p-5">
          <p className="text-sm font-bold text-ink">Write a review</p>
          <form onSubmit={submit} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className="h-10 w-full rounded-full border border-line bg-white px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-ak-800"
                />
              </label>
              <StarInput value={stars} onChange={setStars} />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink">Review</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What did you think of this book?"
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-ak-800"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm font-semibold text-ink">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="rounded-full bg-ak-800 px-6 py-2.5 text-sm font-bold text-white"
            >
              {thanks ? "SAVED" : "SUBMIT REVIEW"}
            </button>
            <p className="text-xs text-muted">Reviews you write are stored on this device only.</p>
          </form>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm font-bold text-ink">Reader reviews on this device</p>
            {userReviews.length === 0 ? (
              <p className="mt-1 text-sm text-muted">No reviews yet — be the first to write one.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {userReviews.map((r, i) => (
                  <li key={`${r.date}-${i}`} className="rounded-xl border border-line p-3">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-ink">{r.name}</span>
                      <span className="rounded-full bg-ak-800 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                        YOU
                      </span>
                      <span className="tnum flex items-center gap-0.5 text-xs font-bold text-ink">
                        <span className="text-gold">
                          <Icon size={12} d={I.star} />
                        </span>
                        {r.stars}/5
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink/80">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
