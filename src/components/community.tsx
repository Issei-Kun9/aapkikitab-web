"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BOOKS } from "@/data/books";
import { ACCOUNT_URL } from "@/data/settings";
import { createPost, fetchPosts, likedIds, timeAgo, toggleLike, uploadMedia, type Post, type PostMedia } from "@/lib/community";
import { getSession, onSiteAccounts, signIn } from "@/lib/customer-account";
import { Icon, I } from "./ui";

/* ---------- the official badge: only ever rendered next to the AapkiKitab Team ---------- */
export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Verified AapkiKitab Team" role="img" className="shrink-0">
      <path
        fill="var(--color-ak-800)"
        d="M12 1.5l2.4 1.9 3-.4 1.1 2.8 2.8 1.1-.4 3 1.9 2.4-1.9 2.4.4 3-2.8 1.1-1.1 2.8-3-.4L12 22.5l-2.4-1.9-3 .4-1.1-2.8-2.8-1.1.4-3L1.5 12l1.9-2.4-.4-3 2.8-1.1L6.9 2.7l3 .4z"
      />
      <path d="m7.8 12.3 2.8 2.8 5.6-5.8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-marigold" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.5 9.7l5.9-.9z" fill={i <= value ? "currentColor" : "var(--color-line)"} />
        </svg>
      ))}
    </span>
  );
}

const AVATAR = ["from-ak-800 to-ak-600", "from-[#c2410c] to-marigold", "from-[#0f766e] to-[#34d399]", "from-rose to-[#f472b6]", "from-[#1d4ed8] to-[#60a5fa]"];
function Avatar({ name }: { name: string }) {
  const tint = AVATAR[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR.length];
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${tint} text-[15px] font-bold text-white`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- media: swipeable photos, tap-to-play video ---------- */
function MediaStrip({ media }: { media: PostMedia[] }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  if (media.length === 0) return null;
  return (
    <div className="relative mt-3 overflow-hidden rounded-xl bg-ak-50">
      <div
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((m, k) => (
          <div key={k} className="aspect-[4/5] w-full shrink-0 snap-center">
            {m.type === "image" ? (
              <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <video src={m.url} poster={m.poster || undefined} controls playsInline preload="none" className="h-full w-full bg-black object-cover" />
            )}
          </div>
        ))}
      </div>
      {media.length > 1 && (
        <>
          <span className="tnum absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-semibold text-white">
            {i + 1}/{media.length}
          </span>
          <span className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {media.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </span>
        </>
      )}
    </div>
  );
}

function LikeButton({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(post.likes);
  const [pop, setPop] = useState(false);
  useEffect(() => setLiked(likedIds().includes(post.id)), [post.id]);
  const toggle = () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) {
      setPop(true);
      window.setTimeout(() => setPop(false), 300);
    }
    toggleLike(post.id, next).then(setCount).catch(() => {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    });
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold transition-colors ${liked ? "bg-rose-50 text-rose" : "text-ink hover:bg-ak-50"}`}
    >
      <span className={`transition-transform duration-300 ${pop ? "scale-125" : "scale-100"}`}><Icon size={19} d={I.heart(liked)} /></span>
      <span className="tnum">{count}</span>
    </button>
  );
}

export function PostCard({ post }: { post: Post }) {
  const [more, setMore] = useState(false);
  const long = post.text.length > 220;
  return (
    <article className="ak-card break-inside-avoid rounded-2xl p-4">
      <header className="flex items-center gap-3">
        <Avatar name={post.name} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-bold text-ink">{post.name}</p>
          <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted">
            {timeAgo(post.at)}
            {post.rating && <Stars value={post.rating} size={12} />}
          </p>
        </div>
        {post.pinned && <span className="rounded-full bg-ak-50 px-2 py-0.5 text-[11px] font-bold text-ak-800">Pinned</span>}
      </header>
      <MediaStrip media={post.media} />
      <p className={`mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink ${!more && long ? "line-clamp-4" : ""}`}>{post.text}</p>
      {long && (
        <button type="button" onClick={() => setMore((m) => !m)} className="mt-1 text-[13px] font-bold text-ak-800">
          {more ? "Show less" : "Read more"}
        </button>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <LikeButton post={post} />
        {post.book && (
          <Link href={`/book/${post.book.handle}`} className="flex min-w-0 items-center gap-2 rounded-full bg-ak-50 py-1 pl-1 pr-3 text-[12.5px] font-semibold text-ak-900 hover:bg-ak-100">
            {post.book.image ? <img src={post.book.image} alt="" className="h-7 w-5 rounded-sm object-cover" /> : <Icon size={14} d={I.grid} />}
            <span className="truncate">{post.book.title}</span>
          </Link>
        )}
      </div>
      {post.reply && (
        <div className="mt-3 rounded-xl border border-ak-100 bg-ak-50/70 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ak-900">
            AapkiKitab Team <VerifiedBadge size={15} />
          </p>
          <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink/90">{post.reply}</p>
        </div>
      )}
    </article>
  );
}

/* ---------- data ---------- */
export function usePosts() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetchPosts()
      .then((d) => setPosts(d.posts))
      .catch(() => {
        setPosts([]);
        setFailed(true);
      });
  }, []);
  return { posts, failed };
}

/* ---------- "Share your experience" ---------- */
const OPEN = "ak-open-composer";
export const openComposer = (book?: string) => window.dispatchEvent(new CustomEvent(OPEN, { detail: { book } }));

export function ShareButton({ book, className = "", label = "Share your experience" }: { book?: string; className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => openComposer(book)}
      className={`inline-flex h-11 items-center gap-2 rounded-full bg-ak-800 pl-3 pr-5 text-[14.5px] font-bold text-white shadow-[0_10px_20px_-12px_rgba(74,31,196,0.9)] transition-colors hover:bg-ak-900 ${className}`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20"><Icon size={16} d={I.plus} /></span>
      {label}
    </button>
  );
}

interface Pending {
  key: string;
  file: File;
  preview: string;
  kind: "image" | "video";
  url?: string;
  error?: string;
}

export function Composer() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [book, setBook] = useState("");
  const [items, setItems] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setText("");
    setRating(0);
    setItems([]);
    setError("");
    setDone(false);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      setBook((e as CustomEvent<{ book?: string }>).detail?.book ?? "");
      setSignedIn(Boolean(getSession()));
      setOpen(true);
    };
    window.addEventListener(OPEN, onOpen);
    // returning from sign-in with ?share=1 reopens the form
    if (new URLSearchParams(window.location.search).get("share") === "1") {
      setSignedIn(Boolean(getSession()));
      setOpen(true);
    }
    return () => window.removeEventListener(OPEN, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...files].slice(0, 4 - items.length).map((file) => ({
      key: `${file.name}-${file.size}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      kind: (file.type.startsWith("video/") ? "video" : "image") as "image" | "video",
    }));
    setItems((cur) => [...cur, ...next]);
    for (const p of next) {
      uploadMedia(p.file)
        .then((r) => setItems((cur) => cur.map((x) => (x.key === p.key ? { ...x, url: r.url } : x))))
        .catch((e: Error) => setItems((cur) => cur.map((x) => (x.key === p.key ? { ...x, error: e.message } : x))));
    }
  };

  const uploading = items.some((x) => !x.url && !x.error);
  const submit = async () => {
    if (text.trim().length < 5) return setError("Please write a few words about your experience.");
    setBusy(true);
    setError("");
    try {
      await createPost({
        text: text.trim(),
        rating: rating || undefined,
        book: book || undefined,
        media: items.filter((x) => x.url).map((x) => ({ url: x.url!, kind: x.kind })),
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Share your experience">
      <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="ak-fade absolute inset-0 bg-ak-950/55" />
      <div className="ak-menu relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-[17px] font-bold text-ink">Share your experience</p>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-ak-50">
            <Icon size={20} d={I.x} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {done ? (
            <div className="py-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf/10 text-leaf"><Icon size={28} d={I.check} /></span>
              <p className="mt-4 font-display text-[22px] font-bold text-ink">Thank you!</p>
              <p className="mt-2 text-[14.5px] text-muted">Our team will look at your post and publish it soon. It usually takes less than a day.</p>
              <button type="button" onClick={() => { reset(); setOpen(false); }} className="mt-6 h-11 rounded-full bg-ak-800 px-6 text-[14.5px] font-bold text-white">
                Done
              </button>
            </div>
          ) : !signedIn ? (
            <div className="py-4 text-center">
              <p className="text-[15px] text-ink">Sign in with your email so we know the post is really from you.</p>
              <p className="mt-1 text-[13.5px] text-muted">We&apos;ll send a 6-digit code. Only your first name is shown publicly.</p>
              {onSiteAccounts ? (
                <button type="button" onClick={() => signIn(`${window.location.pathname}?share=1`)} className="mt-5 h-12 w-full rounded-xl bg-ak-800 text-[15px] font-bold text-white">
                  Continue with email
                </button>
              ) : (
                <a href={ACCOUNT_URL} className="mt-5 flex h-12 items-center justify-center rounded-xl bg-ak-800 text-[15px] font-bold text-white">Continue with email</a>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[13.5px] font-semibold text-ink">How would you rate us? <span className="font-normal text-muted">(optional)</span></p>
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} type="button" onClick={() => setRating(i === rating ? 0 : i)} aria-label={`${i} star${i > 1 ? "s" : ""}`} className="p-0.5">
                      <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.5 9.7l5.9-.9z" fill={i <= rating ? "var(--color-marigold)" : "var(--color-line)"} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-[13.5px] font-semibold text-ink">Your story</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 1500))}
                  rows={5}
                  placeholder="The book, the packaging, the delivery… what did you love?"
                  className="mt-1.5 w-full resize-none rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-ak-800"
                />
                <span className="tnum block text-right text-[12px] text-muted">{text.length}/1500</span>
              </label>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">Photos or video <span className="font-normal text-muted">(up to 4)</span></p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {items.map((x) => (
                    <div key={x.key} className="relative aspect-square overflow-hidden rounded-lg bg-ak-50">
                      {x.kind === "image" ? <img src={x.preview} alt="" className="h-full w-full object-cover" /> : <video src={x.preview} muted className="h-full w-full object-cover" />}
                      {!x.url && !x.error && <span className="absolute inset-0 grid place-items-center bg-white/60"><span className="h-6 w-6 animate-spin rounded-full border-2 border-ak-800 border-t-transparent" /></span>}
                      {x.error && <span className="absolute inset-0 grid place-items-center bg-rose/80 p-1 text-center text-[10.5px] font-bold text-white">{x.error}</span>}
                      <button type="button" aria-label="Remove" onClick={() => setItems((cur) => cur.filter((y) => y.key !== x.key))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
                        <Icon size={13} d={I.x} />
                      </button>
                    </div>
                  ))}
                  {items.length < 4 && (
                    <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-ak-100 text-ak-800 hover:border-ak-800">
                      <Icon size={22} d={I.plus} />
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                <p className="mt-1 text-[12px] text-muted">Photos up to 10 MB, videos up to 60 MB.</p>
              </div>
              <label className="block">
                <span className="text-[13.5px] font-semibold text-ink">About a book? <span className="font-normal text-muted">(optional)</span></span>
                <select value={book} onChange={(e) => setBook(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[14.5px] outline-none focus:border-ak-800">
                  <option value="">General experience</option>
                  {BOOKS.map((b) => <option key={b.slug} value={b.slug}>{b.title}</option>)}
                </select>
              </label>
              {error && <p role="alert" className="text-[13.5px] font-semibold text-rose">{error}</p>}
              <p className="text-[12.5px] text-muted">Posts appear after a quick check by our team. Only your first name is shown.</p>
            </div>
          )}
        </div>

        {signedIn && !done && (
          <div className="border-t border-line px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={busy || uploading || text.trim().length < 5}
              onClick={submit}
              className="h-12 w-full rounded-xl bg-ak-800 text-[15px] font-bold text-white transition-colors hover:bg-ak-900 disabled:bg-ak-100 disabled:text-ak-800/60"
            >
              {busy ? "Sending…" : uploading ? "Uploading…" : "Submit for review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- empty / loading ---------- */
function FirstStory() {
  return (
    <div className="rounded-3xl bg-[linear-gradient(120deg,#f1ebff,#e6dcff)] p-6 text-center sm:p-10">
      <p className="font-display text-[22px] font-bold text-ak-950 sm:text-[26px]">Be the first to share your story</p>
      <p className="mx-auto mt-2 max-w-md text-[14.5px] text-ink/75">Unboxed a book from us? Post a photo, a video or a few words. Every post is checked by our team before it goes live.</p>
      <ShareButton className="mt-5" />
    </div>
  );
}
const Skeleton = () => <div className="ak-card h-[340px] animate-pulse rounded-2xl" />;

/* ---------- homepage: a swipeable row of the latest stories ---------- */
export function CommunityRail() {
  const { posts } = usePosts();
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3 lg:mb-5">
        <div>
          <h2 className="text-[20px] font-bold leading-tight text-ink sm:text-[24px] lg:text-[28px]">Reader Stories</h2>
          <p className="mt-0.5 text-[13.5px] text-muted">Real posts from AapkiKitab readers</p>
        </div>
        <Link href="/community" className="shrink-0 pb-0.5 text-[14.5px] font-bold text-ak-800">View All →</Link>
      </div>
      {posts === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Skeleton /><span className="hidden sm:block"><Skeleton /></span><span className="hidden sm:block"><Skeleton /></span></div>
      ) : posts.length === 0 ? (
        <FirstStory />
      ) : (
        <>
          <div className="-mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
            {posts.slice(0, 10).map((p) => (
              <div key={p.id} className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]">
                <PostCard post={p} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center"><ShareButton /></div>
        </>
      )}
    </div>
  );
}

/* ---------- product page: stories about this book ---------- */
export function BookStories({ slug, title }: { slug: string; title: string }) {
  const { posts } = usePosts();
  const mine = (posts ?? []).filter((p) => p.book?.handle === slug);
  return (
    <section className="mt-10" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[26px] font-bold text-ink lg:text-[34px]">Reader stories</h2>
          <p className="mt-0.5 text-[14px] text-muted">{mine.length ? `${mine.length} ${mine.length === 1 ? "post" : "posts"} about ${title}` : `No posts about ${title} yet`}</p>
        </div>
        <ShareButton book={slug} label="Share yours" />
      </div>
      {mine.length > 0 && (
        <div className="mt-5 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {mine.map((p) => <div key={p.id} className="mb-4"><PostCard post={p} /></div>)}
        </div>
      )}
    </section>
  );
}

/* ---------- /community: the full feed ---------- */
export function CommunityFeed() {
  const { posts } = usePosts();
  const [tab, setTab] = useState<"all" | "media">("all");
  const list = (posts ?? []).filter((p) => tab === "all" || p.media.length > 0);
  return (
    <div>
      <div className="flex gap-2">
        {(
          [
            ["all", "All stories"],
            ["media", "Photos & videos"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            aria-pressed={tab === k}
            className={`h-10 rounded-full px-4 text-[14px] font-semibold transition-colors ${tab === k ? "bg-ak-800 text-white" : "border border-line bg-white text-ink hover:border-ak-800"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {posts === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton /><Skeleton /><Skeleton /></div>
        ) : list.length === 0 ? (
          <FirstStory />
        ) : (
          <div className="gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
            {list.map((p) => <div key={p.id} className="mb-4"><PostCard post={p} /></div>)}
          </div>
        )}
      </div>
    </div>
  );
}
