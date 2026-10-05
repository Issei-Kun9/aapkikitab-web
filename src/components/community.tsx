"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BOOKS } from "@/data/books";
import { communityReady, fetchPosts, likedIds, reportPost, sendComment, timeAgo, toggleLike, type Comment, type Post, type PostMedia } from "@/lib/community";
import { getSession, onSiteAccounts, signIn } from "@/lib/customer-account";
import { ACCOUNT_URL } from "@/data/settings";
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

/* "Verified Purchase": set by the server when the customer has ordered from the shop */
function VerifiedPurchase() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-semibold text-leaf">
      <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" fill="currentColor" /><path d="m8.5 12 2.4 2.4 4.6-4.8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Verified Purchase
    </span>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
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
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const tint = AVATAR[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR.length];
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.38 }} className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${tint} font-bold text-white`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
const TeamAvatar = ({ size = 32 }: { size?: number }) => (
  <img src="/logo.webp" alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-full" />
);

export const duration = (s: number) => (s > 0 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : "");
const PlayIcon = ({ big = false }: { big?: boolean }) => (
  <span className={`grid place-items-center rounded-full border-2 border-white/90 bg-black/35 text-white backdrop-blur-sm ${big ? "h-14 w-14" : "h-9 w-9"}`}>
    <svg width={big ? 22 : 14} height={big ? 22 : 14} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
  </span>
);
const thumbOf = (m: PostMedia) => (m.type === "image" ? m.url : m.poster);

/* ---------- full-screen viewer for photos and videos ---------- */
function Lightbox({ media, start, onClose }: { media: PostMedia[]; start: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(start);
  useEffect(() => {
    ref.current?.scrollTo({ left: start * ref.current.clientWidth });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [start, onClose]);
  return (
    <div className="fixed inset-0 z-[70] bg-black" role="dialog" aria-modal="true" aria-label="Photos and videos">
      <div
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((m, k) => (
          <div key={k} className="grid h-full w-full shrink-0 snap-center place-items-center">
            {m.type === "image" ? (
              <img src={m.url} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <video src={m.url} poster={m.poster || undefined} controls playsInline autoPlay={k === start} className="max-h-full max-w-full" />
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-[calc(12px+env(safe-area-inset-top))] grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
        <Icon size={22} d={I.x} />
      </button>
      {media.length > 1 && <span className="tnum absolute left-1/2 top-[calc(20px+env(safe-area-inset-top))] -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold text-white">{i + 1} / {media.length}</span>}
    </div>
  );
}

/* ---------- media on a card: one big tile, or a row of three like a photo strip ---------- */
function MediaGrid({ media }: { media: PostMedia[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (media.length === 0) return null;
  const tile = (m: PostMedia, k: number, cls: string, big = false) => (
    <button key={k} type="button" onClick={() => setOpen(k)} className={`relative overflow-hidden rounded-xl bg-ak-50 ${cls}`} aria-label={m.type === "video" ? "Play video" : "View photo"}>
      {thumbOf(m) ? <img src={thumbOf(m)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="block h-full w-full bg-ak-950" />}
      {m.type === "video" && (
        <>
          <span className="absolute inset-0 grid place-items-center"><PlayIcon big={big} /></span>
          {duration(m.duration) && <span className="tnum absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11.5px] font-semibold text-white">{duration(m.duration)}</span>}
        </>
      )}
    </button>
  );
  const extra = media.length - 3;
  return (
    <>
      {media.length === 1 ? (
        <div className="mt-3">{tile(media[0], 0, `block w-full ${media[0].type === "video" ? "aspect-[16/10]" : "aspect-[4/3]"}`, true)}</div>
      ) : (
        <div className={`mt-3 grid h-[150px] gap-1.5 sm:h-[180px] ${media.length === 2 ? "grid-cols-2" : "grid-cols-[1.25fr_1fr_0.7fr]"}`}>
          {media.slice(0, 3).map((m, k) =>
            k === 2 && extra > 0 ? (
              <button key={k} type="button" onClick={() => setOpen(2)} className="relative overflow-hidden rounded-xl">
                <img src={thumbOf(m)} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/45 text-[18px] font-bold text-white">+{extra}</span>
              </button>
            ) : (
              tile(m, k, "h-full", k === 0)
            )
          )}
        </div>
      )}
      {open !== null && <Lightbox media={media} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/* ---------- likes (one per device; the count lives in Shopify) ---------- */
function Like({ likeKey, initial, small = false }: { likeKey: string; initial: number; small?: boolean }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initial);
  const [pop, setPop] = useState(false);
  useEffect(() => setLiked(likedIds().includes(likeKey)), [likeKey]);
  const toggle = () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) {
      setPop(true);
      window.setTimeout(() => setPop(false), 300);
    }
    toggleLike(likeKey, next).then(setCount).catch(() => {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    });
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className={`inline-flex items-center gap-1.5 font-semibold ${small ? "text-[13px]" : "text-[14.5px]"} ${liked ? "text-rose" : "text-ink"}`}>
      <span className={`transition-transform duration-300 ${pop ? "scale-125" : "scale-100"}`}>
        <svg width={small ? 17 : 22} height={small ? 17 : 22} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20.5S4.5 15.6 4.5 10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3.5c0 5.1-7.5 10-7.5 10z" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="tnum">{count}</span>
    </button>
  );
}

function Toast({ text }: { text: string }) {
  return <p role="status" className="ak-fade fixed bottom-[96px] left-1/2 z-[75] -translate-x-1/2 whitespace-nowrap rounded-full bg-ak-950 px-4 py-2 text-[13.5px] font-semibold text-white shadow-lg lg:bottom-8">{text}</p>;
}
function useToast() {
  const [t, setT] = useState("");
  const show = (s: string) => {
    setT(s);
    window.setTimeout(() => setT(""), 2200);
  };
  return { toast: t ? <Toast text={t} /> : null, show };
}

const postAnchor = (id: string) => `post-${id.split("/").pop()}`;

/* ---------- comments + the team reply ---------- */
function TeamReply({ post }: { post: Post }) {
  return (
    <div className="flex gap-2.5 rounded-xl border-l-[3px] border-ak-800 bg-ak-50/80 p-3">
      <TeamAvatar size={30} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-1.5 text-[13.5px] font-bold text-ak-900">
          AapkiKitab Team <VerifiedBadge size={15} />
          {post.replyAt && <span className="text-[12px] font-normal text-muted">{timeAgo(post.replyAt)}</span>}
        </p>
        <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink">{post.reply}</p>
        <div className="mt-2"><Like likeKey={`${post.id}#reply`} initial={post.replyLikes} small /></div>
      </div>
    </div>
  );
}

function CommentRow({ c }: { c: Comment }) {
  return (
    <li className="flex gap-2.5">
      <Avatar name={c.name} size={30} />
      <div className="min-w-0 flex-1 rounded-xl bg-paper px-3 py-2">
        <p className="text-[13px] font-bold text-ink">{c.name} <span className="font-normal text-muted">· {timeAgo(c.at)}</span></p>
        <p className="mt-0.5 whitespace-pre-line text-[13.5px] text-ink">{c.text}</p>
        <div className="mt-1"><Like likeKey={c.id} initial={c.likes} small /></div>
      </div>
    </li>
  );
}

function CommentBox({ postId, onSent }: { postId: string; onSent: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => setSignedIn(Boolean(getSession())), []);
  if (!signedIn) {
    return (
      <button type="button" onClick={() => (onSiteAccounts ? signIn(`/community#${postAnchor(postId)}`) : window.location.assign(ACCOUNT_URL))} className="w-full rounded-xl border border-dashed border-ak-100 py-2.5 text-[13.5px] font-semibold text-ak-800">
        Sign in to comment
      </button>
    );
  }
  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await sendComment(postId, text);
      setText("");
      onSent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} onKeyDown={(e) => e.key === "Enter" && text.trim() && send()} placeholder="Add a comment…" className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-[14px] outline-none focus:border-ak-800" />
        <button type="button" disabled={busy || text.trim().length < 2} onClick={send} aria-label="Send comment" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ak-800 text-white disabled:bg-ak-100">
          <Icon size={17} d={I.arrow} />
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-[12.5px] font-semibold text-rose">{error}</p>}
    </div>
  );
}

/* ---------- ⋯ menu ---------- */
function MoreMenu({ post, onToast }: { post: Post; onToast: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const url = () => `${window.location.origin}/community#${postAnchor(post.id)}`;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="More options" aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-ak-50">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="19" cy="12" r="1.8" fill="currentColor" /></svg>
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="ak-menu absolute bottom-full right-0 z-20 mb-1 w-44 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_16px_40px_-16px_rgba(23,11,69,0.4)]">
            <button type="button" className="block w-full px-4 py-2.5 text-left text-[14px] text-ink hover:bg-ak-50" onClick={() => { navigator.clipboard?.writeText(url()); setOpen(false); onToast("Link copied"); }}>
              Copy link
            </button>
            <button type="button" className="block w-full px-4 py-2.5 text-left text-[14px] text-rose hover:bg-rose-50" onClick={() => { setOpen(false); reportPost(post.id, "Reported from the website").then(() => onToast("Thanks, our team will take a look")).catch(() => onToast("Couldn't send the report")); }}>
              Report post
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- the card ---------- */
export function PostCard({ post, preview = false }: { post: Post; preview?: boolean }) {
  const [more, setMore] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { toast, show } = useToast();
  const long = post.text.length > 180;
  const count = post.comments.length + (post.reply ? 1 : 0);
  useEffect(() => {
    if (window.location.hash === `#${postAnchor(post.id)}`) setShowComments(true);
  }, [post.id]);
  const share = async () => {
    const url = `${window.location.origin}/community#${postAnchor(post.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${post.name} on AapkiKitab`, text: post.text.slice(0, 120), url });
      else {
        await navigator.clipboard.writeText(url);
        show("Link copied");
      }
    } catch {
      /* share sheet dismissed */
    }
  };
  return (
    <article id={postAnchor(post.id)} className="ak-card scroll-mt-40 break-inside-avoid rounded-2xl p-4">
      <header className="flex items-start gap-3">
        <Avatar name={post.name} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-bold text-ink">{post.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            {post.rating && <Stars value={post.rating} size={13} />}
            {post.at && <span>{timeAgo(post.at)}</span>}
            {post.verified && <VerifiedPurchase />}
          </div>
        </div>
        {post.pinned && <span className="rounded-full bg-ak-50 px-2 py-0.5 text-[11px] font-bold text-ak-800">Pinned</span>}
      </header>
      <p className={`mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink ${!more && long ? "line-clamp-3" : ""}`}>{post.text}</p>
      {long && (
        <button type="button" onClick={() => setMore((m) => !m)} className="mt-0.5 text-[13px] font-bold text-ak-800">
          {more ? "Show less" : "Read more"}
        </button>
      )}
      <MediaGrid media={post.media} />
      {post.book && (
        <Link href={`/book/${post.book.handle}`} className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-ak-50 py-1 pl-1 pr-3 text-[12.5px] font-semibold text-ak-900 hover:bg-ak-100">
          {post.book.image ? <img src={post.book.image} alt="" className="h-7 w-5 rounded-sm object-cover" /> : <Icon size={14} d={I.grid} />}
          <span className="truncate">{post.book.title}</span>
        </Link>
      )}
      {!preview && (
        <div className="mt-3 flex items-center gap-5 border-t border-line pt-3">
          <Like likeKey={post.id} initial={post.likes} />
          <button type="button" onClick={() => setShowComments((s) => !s)} aria-expanded={showComments} aria-label="Comments" className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-ink">
            <Icon size={21} d={I.chat} />
            <span className="tnum">{count}</span>
          </button>
          <button type="button" onClick={share} className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 5l7 7-7 7M21 12H9a6 6 0 0 0-6 6v1" /></svg>
            Share
          </button>
          <span className="ml-auto"><MoreMenu post={post} onToast={show} /></span>
        </div>
      )}
      {!preview && post.reply && <div className="mt-3"><TeamReply post={post} /></div>}
      {!preview && showComments && (
        <div className="mt-3 space-y-3">
          {post.comments.length > 0 && <ul className="space-y-2.5">{post.comments.map((c) => <CommentRow key={c.id} c={c} />)}</ul>}
          <CommentBox postId={post.id} onSent={() => show("Thanks! Your comment appears after a quick check")} />
        </div>
      )}
      {toast}
    </article>
  );
}

/* ---------- data ---------- */
export function usePosts() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [ready, setReady] = useState(true);
  useEffect(() => {
    fetchPosts()
      .then((d) => {
        setPosts(d.posts);
        setReady(d.setup);
      })
      .catch(() => {
        setPosts([]);
        setReady(false);
      });
  }, []);
  return { posts, ready };
}

export function ShareButton({ book, className = "", label = "Share Your Experience" }: { book?: string; className?: string; label?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    communityReady().then(setReady);
  }, []);
  if (!ready) return null;
  return (
    <Link
      href={`/community/share${book ? `?book=${encodeURIComponent(book)}` : ""}`}
      className={`inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-xl bg-ak-800 px-4 text-[14px] font-bold text-white sm:px-5 sm:text-[15px] shadow-[0_10px_20px_-12px_rgba(74,31,196,0.9)] transition-colors hover:bg-ak-900 ${className}`}
    >
      <Icon size={18} d={I.plus} />
      {label}
    </Link>
  );
}

const Skeleton = () => <div className="ak-card h-[300px] animate-pulse rounded-2xl" />;
function FirstStory() {
  return (
    <div className="ak-card rounded-2xl p-6 text-center sm:p-10">
      <p className="font-display text-[22px] font-bold text-ak-950">Be the first to share your story</p>
      <p className="mx-auto mt-2 max-w-md text-[14.5px] text-muted">Unboxed a book from us? Post a photo, a video or a few words. Every post is checked by our team before it goes live.</p>
      <ShareButton className="mt-5" />
    </div>
  );
}

/* ---------- homepage: a swipeable row of the latest stories ---------- */
export function CommunityRail() {
  const { posts, ready } = usePosts();
  if (!ready) return null;
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3 lg:mb-5">
        <div>
          <h2 className="text-[20px] font-bold leading-tight text-ink sm:text-[24px] lg:text-[28px]">Customer Reviews</h2>
          <p className="mt-0.5 text-[13.5px] text-muted">Real customers. Real experiences.</p>
        </div>
        <Link href="/community" className="shrink-0 pb-0.5 text-[14.5px] font-bold text-ak-800">See All →</Link>
      </div>
      {posts === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Skeleton /><span className="hidden sm:block"><Skeleton /></span><span className="hidden sm:block"><Skeleton /></span></div>
      ) : posts.length === 0 ? (
        <FirstStory />
      ) : (
        <>
          <div className="-mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
            {posts.slice(0, 10).map((p) => (
              <div key={p.id} className="w-[86%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]">
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
  const { posts, ready } = usePosts();
  const mine = (posts ?? []).filter((p) => p.book?.handle === slug);
  if (!ready) return null;
  return (
    <section className="mt-10" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[26px] font-bold text-ink lg:text-[34px]">Customer reviews</h2>
          <p className="mt-0.5 text-[14px] text-muted">{mine.length ? `${mine.length} ${mine.length === 1 ? "review" : "reviews"} of ${title}` : `No reviews of ${title} yet`}</p>
        </div>
        <ShareButton book={slug} label="Write a review" />
      </div>
      {mine.length > 0 && (
        <div className="mt-5 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {mine.map((p) => <div key={p.id} className="mb-4"><PostCard post={p} /></div>)}
        </div>
      )}
    </section>
  );
}

/* ---------- /community: hero, filters, search, feed ---------- */
const FILTERS = ["All", "Photos", "Videos", "Latest", "Top Rated"] as const;
type Filter = (typeof FILTERS)[number];

function Collage({ posts }: { posts: Post[] }) {
  const pics = posts.flatMap((p) => p.media.map(thumbOf)).filter(Boolean).slice(0, 3);
  const covers = BOOKS.filter((b) => b.cover).slice(0, 3).map((b) => b.cover!);
  const imgs = (pics.length >= 2 ? pics : covers).slice(0, 3);
  const spots = ["right-[34%] top-1 rotate-[-6deg]", "right-1 top-0 rotate-[5deg]", "right-[14%] top-[44%] rotate-[-2deg]"];
  return (
    <div aria-hidden="true" className="relative h-[130px] w-[34%] max-w-[230px] shrink-0 sm:h-[180px] sm:w-[40%]">
      {imgs.map((src, i) => (
        <img key={i} src={src} alt="" className={`absolute h-[58%] w-[52%] rounded-lg border-[3px] border-white object-cover shadow-[0_10px_24px_-10px_rgba(23,11,69,0.55)] ${spots[i]}`} />
      ))}
    </div>
  );
}

export function CommunityScreen() {
  const { posts, ready } = usePosts();
  const [filter, setFilter] = useState<Filter>("All");
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!posts?.length || !window.location.hash) return;
    document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
  }, [posts]);

  const list = (posts ?? [])
    .filter((p) => (filter === "Photos" ? p.media.some((m) => m.type === "image") : filter === "Videos" ? p.media.some((m) => m.type === "video") : true))
    .filter((p) => !q.trim() || `${p.name} ${p.text} ${p.book?.title ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) =>
      filter === "Top Rated" ? (b.rating ?? 0) - (a.rating ?? 0) || b.likes - a.likes : filter === "Latest" ? b.at.localeCompare(a.at) : 0
    );

  return (
    <div className="py-4">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Back" className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-white/70">
          <span className="rotate-180"><Icon size={22} d={I.arrow} /></span>
        </Link>
        <h1 className="flex-1 text-[19px] font-bold text-ink lg:text-[24px]">Customer Reviews</h1>
        {ready && (
          <button type="button" onClick={() => { if (searching) setQ(""); setSearching(!searching); }} aria-label="Search reviews" aria-expanded={searching} className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-white/70">
            <Icon size={22} d={searching ? I.x : I.search} />
          </button>
        )}
      </div>
      {searching && (
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews, names or books…" className="mt-2 h-11 w-full rounded-full border border-line bg-white px-4 text-[15px] outline-none focus:border-ak-800" />
      )}

      <div className="mt-3 flex items-center gap-3 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#f3eeff,#e3d8ff)] p-5 sm:p-8">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[26px] font-bold leading-[1.1] text-ak-950 sm:text-[38px]">Real Customers.<br />Real Experiences.</h2>
          <p className="mt-2 text-[14px] text-ink/75 sm:text-[16px]">See what our customers say about AapkiKitab.</p>
          {ready ? <ShareButton className="mt-4" /> : <p className="mt-4 text-[14px] font-semibold text-ak-800">Sharing opens soon.</p>}
        </div>
        <Collage posts={posts ?? []} />
      </div>

      {ready && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={`h-10 shrink-0 rounded-xl px-4 text-[14px] font-semibold transition-colors ${filter === f ? "bg-ak-800 text-white" : "border border-line bg-white text-ink hover:border-ak-800"}`}>
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {!ready ? (
          <div className="ak-card rounded-2xl p-6 text-center">
            <p className="font-display text-[20px] font-bold text-ak-950">Customer Reviews are opening soon</p>
            <p className="mx-auto mt-2 max-w-md text-[14.5px] text-muted">Soon you&apos;ll be able to share photos, videos and words about your AapkiKitab order here.</p>
          </div>
        ) : posts === null ? (
          <div className="grid gap-4 sm:grid-cols-2"><Skeleton /><Skeleton /></div>
        ) : list.length === 0 ? (
          posts.length === 0 ? <FirstStory /> : <p className="py-10 text-center text-[15px] text-muted">No reviews match.</p>
        ) : (
          <div className="gap-4 [column-fill:_balance] md:columns-2 xl:columns-3">
            {list.map((p) => <div key={p.id} className="mb-4"><PostCard post={p} /></div>)}
          </div>
        )}
      </div>
    </div>
  );
}
