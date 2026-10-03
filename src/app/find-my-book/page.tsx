"use client";

import { useMemo, useRef, useState } from "react";
import { BOOKS } from "@/data/books";
import { BUDGETS, CATEGORIES, EXAMS, MOODS } from "@/data/taxonomy";
import { BookCard, EmptyState } from "@/components/ui";

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink focus:border-ak-800 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted">{label}</label>
      {children}
    </div>
  );
}

export default function FindMyBookPage() {
  const [mood, setMood] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [language, setLanguage] = useState("");
  const [exam, setExam] = useState("");
  const [show, setShow] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const languages = useMemo(() => [...new Set(BOOKS.map((b) => b.language))], []);

  const matches = useMemo(() => {
    const band = BUDGETS.find((b) => b.slug === budget);
    return BOOKS.filter((b) => {
      if (mood && !b.moods.includes(mood)) return false;
      if (category && !b.categories.includes(category)) return false;
      if (band && b.price > band.max) return false;
      if (language && b.language !== language) return false;
      if (exam && !b.exams.includes(exam)) return false;
      return true;
    });
  }, [mood, category, budget, language, exam]);

  const go = () => {
    setShow(true);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <div className="py-6">
      <h1 className="font-display text-3xl text-ink">Find My Book</h1>
      <p className="mt-1 text-sm text-muted">Answer five quick questions — we&apos;ll match books for you.</p>
      <div className="mt-5 grid max-w-2xl gap-4 rounded-xl border border-line bg-white p-5">
        <Field label="Interest">
          <select className={inputCls} value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="">Any interest</option>
            {MOODS.map((m) => (
              <option key={m.slug} value={m.slug}>{m.label} — {m.sub}</option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any category</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Budget">
            <select className={inputCls} value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option value="">Any budget</option>
              {BUDGETS.map((b) => (
                <option key={b.slug} value={b.slug}>{b.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <select className={inputCls} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Any language</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Exam">
            <select className={inputCls} value={exam} onChange={(e) => setExam(e.target.value)}>
              <option value="">No exam</option>
              {EXAMS.map((x) => (
                <option key={x.slug} value={x.slug}>{x.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <button
          type="button"
          onClick={go}
          className="rounded-full bg-ak-800 px-6 py-3 text-sm font-bold text-white"
        >
          SHOW BOOKS
        </button>
      </div>

      {show && (
        <div ref={resultsRef} className="mt-8 scroll-mt-4">
          <h2 className="mb-3 font-display text-[22px] text-ink">
            {matches.length} {matches.length === 1 ? "match" : "matches"} for you
          </h2>
          {matches.length === 0 ? (
            <EmptyState
              title="No books found"
              text="Try loosening a filter — or tell us what you are looking for."
              cta="Request a Book"
              href="/request-book"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {matches.map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
