"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BOOKS } from "@/data/books";
import { ACCOUNT_URL } from "@/data/settings";
import { communityReady, createPost, uploadMedia, type Post } from "@/lib/community";
import { customerQuery, getSession, onSiteAccounts, signIn } from "@/lib/customer-account";
import { PostCard, duration } from "./community";
import { Icon, I } from "./ui";

interface Pending {
  key: string;
  file: File;
  preview: string;
  kind: "image" | "video";
  seconds: number;
  url?: string;
  error?: string;
}

const STEPS = ["Add Content", "Preview", "Submit"];
const MAX = 5;

function Stepper({ step }: { step: number }) {
  return (
    <ol className="relative grid grid-cols-3">
      <span aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-5 h-0.5 bg-line" />
      <span aria-hidden="true" className="absolute left-[16.6%] top-5 h-0.5 bg-ak-800 transition-all" style={{ width: `${step * 33.4}%` }} />
      {STEPS.map((s, i) => (
        <li key={s} className="relative flex flex-col items-center gap-1.5">
          <span className={`grid h-10 w-10 place-items-center rounded-full border-2 text-[15px] font-bold transition-colors ${i <= step ? "border-ak-800 bg-ak-800 text-white" : "border-line bg-white text-ink"}`}>
            {i < step ? <Icon size={18} d={I.check} /> : i + 1}
          </span>
          <span className={`text-[13px] font-semibold ${i === step ? "text-ak-800" : "text-muted"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function ShareExperience() {
  const params = useSearchParams();
  const [ready, setReady] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState("You");
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [book, setBook] = useState("");
  const [items, setItems] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    communityReady().then(setReady);
    setSignedIn(Boolean(getSession()));
    setBook(params.get("book") ?? "");
    customerQuery<{ customer: { firstName: string | null; lastName: string | null } }>("{ customer { firstName lastName } }")
      .then((d) => d?.customer.firstName && setName(`${d.customer.firstName}${d.customer.lastName ? ` ${d.customer.lastName.charAt(0)}.` : ""}`))
      .catch(() => {});
  }, [params]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Pending[] = [...files].slice(0, MAX - items.length).map((file) => ({
      key: `${file.name}-${file.size}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? "video" : "image",
      seconds: 0,
    }));
    setItems((cur) => [...cur, ...next]);
    for (const p of next) {
      uploadMedia(p.file)
        .then((r) => setItems((cur) => cur.map((x) => (x.key === p.key ? { ...x, url: r.url } : x))))
        .catch((e: Error) => setItems((cur) => cur.map((x) => (x.key === p.key ? { ...x, error: e.message } : x))));
    }
  };
  const uploading = items.some((x) => !x.url && !x.error);
  const good = items.filter((x) => x.url);

  const preview: Post = {
    id: "preview",
    name,
    text: text.trim(),
    rating: rating || null,
    likes: 0,
    verified: false,
    reply: "",
    replyLikes: 0,
    replyAt: "",
    pinned: false,
    at: new Date().toISOString(),
    media: good.map((x) => (x.kind === "image" ? { type: "image", url: x.preview, w: 0, h: 0 } : { type: "video", url: x.preview, poster: "", duration: x.seconds })),
    book: book ? { handle: book, title: BOOKS.find((b) => b.slug === book)?.title ?? "", image: BOOKS.find((b) => b.slug === book)?.cover ?? "" } : null,
    comments: [],
  };

  const submit = async () => {
    setStep(2);
    setBusy(true);
    setError("");
    try {
      await createPost({ text: text.trim(), rating: rating || undefined, book: book || undefined, media: good.map((x) => ({ url: x.url!, kind: x.kind })) });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="flex items-center gap-2 py-4">
      <button type="button" onClick={() => (step > 0 && !done ? setStep(step - 1) : history.length > 1 ? history.back() : window.location.assign("/community"))} aria-label="Back" className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-white/70">
        <span className="rotate-180"><Icon size={22} d={I.arrow} /></span>
      </button>
      <h1 className="text-[19px] font-bold text-ink lg:text-[24px]">Share Your Experience</h1>
    </div>
  );

  if (ready === false) {
    return (
      <div className="mx-auto max-w-xl">
        {header}
        <div className="ak-card rounded-2xl p-6 text-center"><p className="font-display text-[20px] font-bold text-ak-950">Sharing opens soon</p></div>
      </div>
    );
  }
  if (!signedIn) {
    return (
      <div className="mx-auto max-w-xl">
        {header}
        <div className="ak-card rounded-2xl p-6 text-center">
          <p className="font-display text-[22px] font-bold text-ak-950">Sign in to share</p>
          <p className="mt-2 text-[14.5px] text-muted">We&apos;ll email you a 6-digit code, so we know the review is really yours. Only your first name is shown.</p>
          {onSiteAccounts ? (
            <button type="button" onClick={() => signIn(`/community/share${book ? `?book=${book}` : ""}`)} className="mt-5 h-12 w-full rounded-xl bg-ak-800 text-[15px] font-bold text-white">Continue with email</button>
          ) : (
            <a href={ACCOUNT_URL} className="mt-5 flex h-12 items-center justify-center rounded-xl bg-ak-800 text-[15px] font-bold text-white">Continue with email</a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl pb-6">
      {header}
      <Stepper step={done ? 3 : step} />

      {step === 0 && (
        <div className="mt-7 flex flex-col gap-6">
          <div>
            <p className="text-[16px] font-bold text-ink">Your Rating</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i === rating ? 0 : i)} aria-label={`${i} star${i > 1 ? "s" : ""}`}>
                  <svg width={36} height={36} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.5 9.7l5.9-.9z" fill={i <= rating ? "var(--color-marigold)" : "none"} stroke={i <= rating ? "var(--color-marigold)" : "var(--color-ak-800)"} strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-[16px] font-bold text-ink">Write Your Review</span>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} rows={5} placeholder="Tell us about your experience with AapkiKitab..." className="mt-2 w-full resize-none rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none focus:border-ak-800" />
            <span className="tnum block text-right text-[13px] text-muted">{text.length}/500</span>
          </label>
          <div>
            <p className="text-[16px] font-bold text-ink">Add Photos / Videos <span className="font-normal text-muted">(Optional)</span></p>
            <p className="mt-0.5 text-[13.5px] text-muted">You can add up to {MAX} photos or videos.</p>
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {items.length < MAX && (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ak-100 bg-white text-center text-ak-800 hover:border-ak-800">
                  <Icon size={26} d={I.plus} />
                  <span className="px-1 text-[12.5px] font-semibold text-ink">Upload Photos / Videos</span>
                </button>
              )}
              {items.map((x) => (
                <div key={x.key} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ak-950">
                  {x.kind === "image" ? (
                    <img src={x.preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <video src={x.preview} muted preload="metadata" onLoadedMetadata={(e) => { const s = e.currentTarget.duration; setItems((cur) => cur.map((y) => (y.key === x.key ? { ...y, seconds: s } : y))); }} className="h-full w-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center"><span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-black/35 text-white"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg></span></span>
                      {duration(x.seconds) && <span className="tnum absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 text-[11px] font-semibold text-white">{duration(x.seconds)}</span>}
                    </>
                  )}
                  {!x.url && !x.error && <span className="absolute inset-0 grid place-items-center bg-white/60"><span className="h-7 w-7 animate-spin rounded-full border-2 border-ak-800 border-t-transparent" /></span>}
                  {x.error && <span className="absolute inset-0 grid place-items-center bg-rose/85 p-2 text-center text-[11px] font-bold text-white">{x.error}</span>}
                  <button type="button" aria-label="Remove" onClick={() => setItems((cur) => cur.filter((y) => y.key !== x.key))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink">
                    <Icon size={14} d={I.x} />
                  </button>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </div>
          <label className="block">
            <span className="text-[16px] font-bold text-ink">About a book? <span className="font-normal text-muted">(Optional)</span></span>
            <select value={book} onChange={(e) => setBook(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-ak-800">
              <option value="">My overall AapkiKitab experience</option>
              {BOOKS.map((b) => <option key={b.slug} value={b.slug}>{b.title}</option>)}
            </select>
          </label>
          <div className="rounded-2xl bg-ak-50 p-4">
            <p className="flex items-center gap-2 text-[15px] font-bold text-ak-900">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></svg>
              Tips for a helpful review:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-9 text-[14px] text-ink/85">
              <li>Share your honest experience</li>
              <li>Add clear photos or videos</li>
              <li>Mention product, packaging or delivery</li>
            </ul>
          </div>
          <button type="button" disabled={text.trim().length < 5 || uploading} onClick={() => setStep(1)} className="h-14 rounded-2xl bg-ak-800 text-[17px] font-bold text-white transition-colors hover:bg-ak-900 disabled:bg-ak-100 disabled:text-ak-800/60">
            {uploading ? "Uploading…" : "Next"}
          </button>
          {text.trim().length < 5 && <p className="-mt-3 text-center text-[13px] text-muted">Write a few words to continue</p>}
        </div>
      )}

      {step === 1 && (
        <div className="mt-7">
          <p className="mb-3 text-[14px] text-muted">This is how your review will look:</p>
          <PostCard post={preview} preview />
          <p className="mt-4 rounded-xl bg-ak-50 p-3 text-[13.5px] text-ak-900">Our team checks every review before it goes live, usually within a day.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setStep(0)} className="h-14 rounded-2xl border border-ak-800/30 text-[16px] font-bold text-ak-800">Edit</button>
            <button type="button" onClick={submit} className="h-14 rounded-2xl bg-ak-800 text-[16px] font-bold text-white hover:bg-ak-900">Submit</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10 text-center">
          {busy ? (
            <>
              <span className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-ak-800 border-t-transparent" />
              <p className="mt-4 text-[16px] font-semibold text-ink">Sending your review…</p>
            </>
          ) : done ? (
            <>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf/10 text-leaf"><Icon size={32} d={I.check} /></span>
              <p className="mt-4 font-display text-[26px] font-bold text-ak-950">Thank you!</p>
              <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted">Your review has been sent to our team. It will appear on AapkiKitab once approved.</p>
              <Link href="/community" className="mt-6 inline-flex h-12 items-center rounded-xl bg-ak-800 px-6 text-[15px] font-bold text-white">Back to Customer Reviews</Link>
            </>
          ) : (
            <>
              <p className="text-[16px] font-semibold text-rose">{error || "Something went wrong."}</p>
              <button type="button" onClick={() => setStep(1)} className="mt-5 h-12 rounded-xl border border-ak-800/30 px-6 text-[15px] font-bold text-ak-800">Try again</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
