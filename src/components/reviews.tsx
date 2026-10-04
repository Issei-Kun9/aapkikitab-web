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
      <h2 id="reviews-heading" className="mb-5 font-display text-[26px] font-semibold tracking-[-0.02em] text-ink lg:text-[32px]">
        Ratings &amp; reviews
      </h2>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Aggregate panel: only real numbers, never an invented distribution */}
        <div className="rounded-2xl bg-ak-50 p-6">
          {book.reviews > 0 && book.rating > 0 ? (
            <>
              <p className="flex items-baseline gap-2">
                <span className="tnum font-display text-[56px] font-semibold leading-none text-ink">{book.rating.toFixed(1)}</span>
                <span className="text-marigold"><Icon size={22} d={I.star} /></span>
              </p>
              <p className="tnum mt-2 text-[14px] text-muted">
                From {book.reviews.toLocaleString("en-IN")} verified {book.reviews === 1 ? "rating" : "ratings"}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-[22px] font-semibold leading-tight text-ink">No ratings yet</p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                Bought this from us? Your rating will be the first one other readers see.
              </p>
            </>
          )}
        </div>

        {/* Write a review + reader reviews (local only, never seeded) */}
        <div className="rounded-2xl border border-line bg-white p-5">
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
                  className="h-11 w-full rounded-lg border border-line bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:border-ak-800 focus:shadow-[0_0_0_4px_rgba(75,15,138,0.08)]"
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
                className="h-12 w-full rounded-lg border border-line bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-ak-800 focus:shadow-[0_0_0_4px_rgba(75,15,138,0.08)]"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm font-semibold text-ink">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-ak-800 px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-ak-900"
            >
              {thanks ? "Saved" : "Submit review"}
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
                  <li key={`${r.date}-${i}`} className="rounded-2xl border border-line p-3">
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
