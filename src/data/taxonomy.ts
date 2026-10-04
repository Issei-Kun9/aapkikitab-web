import { SITE_CONTENT } from "./site-content";
export interface Tile {
  slug: string;
  label: string;
  sub: string;
  icon: string;
  href: string;
  image?: string; // relevant photo/cover; falls back to monogram tile
}

const ol = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
const us = (id: string, w = 400) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

const STATIC_MOODS: Tile[]  = [
  { slug: "feel", label: "Feel", sub: "Emotional", icon: "heart", href: "/mood/feel", image: ol("9780061122415") },
  { slug: "thrill", label: "Thrill", sub: "Mystery & Thriller", icon: "flame", href: "/mood/thrill", image: ol("9781250301697") },
  { slug: "learn", label: "Learn", sub: "Knowledge", icon: "brain", href: "/mood/learn", image: ol("9780062316097") },
  { slug: "reflect", label: "Reflect", sub: "Spiritual", icon: "lamp", href: "/mood/reflect", image: ol("9780802132215") },
  { slug: "love", label: "Love", sub: "Romance", icon: "hearts", href: "/mood/love", image: ol("9780141439518") },
  { slug: "grow", label: "Grow", sub: "Self-help", icon: "sprout", href: "/mood/grow", image: ol("9780735211292") },
  { slug: "escape", label: "Escape", sub: "Fiction", icon: "leaf", href: "/mood/escape", image: ol("9780747532699") },
  { slug: "light", label: "Light", sub: "Easy Reads", icon: "sun", href: "/mood/light", image: ol("9780142410370") },
];

const STATIC_EXAMS: Tile[]  = [
  { slug: "jee", label: "JEE", sub: "Engineering", icon: "atom", href: "/exam/jee", image: us("1524995997946-a1c2e315a42f") },
  { slug: "neet", label: "NEET", sub: "Medical", icon: "pulse", href: "/exam/neet", image: us("1512820790803-83ca734da794") },
  { slug: "upsc", label: "UPSC", sub: "Civil Services", icon: "landmark", href: "/exam/upsc", image: us("1481627834876-b7833e8f5570") },
  { slug: "ssc", label: "SSC", sub: "Staff Selection", icon: "file", href: "/exam/ssc", image: us("1495446815901-a7297e633e8d") },
  { slug: "banking", label: "Banking", sub: "IBPS • SBI", icon: "bank", href: "/exam/banking", image: us("1532012197267-da84d127e765") },
  { slug: "railway", label: "Railway", sub: "RRB • NTPC", icon: "train", href: "/exam/railway", image: us("1544716278-ca5e3f4abd8c") },
  { slug: "cuet", label: "CUET", sub: "University", icon: "cap", href: "/exam/cuet", image: us("1519682337058-a94d519337bc") },
  { slug: "cat", label: "CAT", sub: "MBA", icon: "chart", href: "/exam/cat", image: us("1507842217343-583bb7270b66") },
  { slug: "gate", label: "GATE", sub: "M.Tech", icon: "gear", href: "/exam/gate", image: us("1506880018603-83d5b814b5a6") },
  { slug: "school", label: "School", sub: "Class 1–12", icon: "book", href: "/exam/school", image: us("1521587760476-6c12a4b040da") },
  { slug: "college", label: "College", sub: "UG • PG", icon: "library", href: "/exam/college", image: us("1524995997946-a1c2e315a42f") },
  { slug: "maths-science", label: "Maths & Science", sub: "Concepts", icon: "sigma", href: "/exam/maths-science" },
];

const STATIC_CATEGORIES: Tile[]  = [
  { slug: "fiction", label: "Fiction", sub: "Stories", icon: "novel", href: "/category/fiction", image: ol("9780061122415") },
  { slug: "mystery-thriller", label: "Mystery & Thriller", sub: "Page-turners", icon: "eye", href: "/category/mystery-thriller", image: ol("9781250301697") },
  { slug: "self-help", label: "Self Help", sub: "Become more", icon: "sprout", href: "/category/self-help", image: ol("9780857197689") },
  { slug: "hindi-literature", label: "Hindi Literature", sub: "साहित्य", icon: "scroll", href: "/category/hindi-literature", image: ol("8176501662") },
  { slug: "english-literature", label: "English Literature", sub: "Classics", icon: "feather", href: "/category/english-literature", image: ol("9780141439518") },
  { slug: "biography-history", label: "Biography & History", sub: "Real lives", icon: "portrait", href: "/category/biography-history", image: ol("9788173711466") },
  { slug: "children", label: "Children", sub: "Young readers", icon: "balloon", href: "/category/children", image: ol("9780747532699") },
  { slug: "education-exams", label: "Education & Exams", sub: "Prep", icon: "cap", href: "/category/education-exams" },
  { slug: "maths-science", label: "Maths & Science", sub: "Concepts", icon: "sigma", href: "/category/maths-science" },
];

const STATIC_BUDGETS = [
  { slug: "under-199", label: "Under ₹199", max: 199 },
  { slug: "under-299", label: "Under ₹299", max: 299 },
  { slug: "under-499", label: "Under ₹499", max: 499 },
  { slug: "under-999", label: "Under ₹999", max: 999 },
];

export interface Store {
  slug: string;
  name: string;
  location: string;
  about: string;
  phone: string;
  tag: string;
  photo: string;
}

const STATIC_STORES: Store[]  = [
  {
    slug: "abc-bookstore",
    name: "ABC Bookstore",
    location: "Johari Bazaar, Jaipur",
    about: "A family-run bookstore serving Jaipur's readers since 1998. Strong in exam prep, Hindi literature and children's books.",
    phone: "+91-98290-00000",
    tag: "store:abc-bookstore",
    photo: us("1481627834876-b7833e8f5570", 800),
  },
  {
    slug: "kitab-ghar",
    name: "Kitab Ghar",
    location: "Nai Sarak, Delhi",
    about: "Old Delhi's beloved book lane veteran. Curated fiction, biographies and classics at honest prices.",
    phone: "+91-98110-00000",
    tag: "store:kitab-ghar",
    photo: us("1521587760476-6c12a4b040da", 800),
  },
];

export interface Promo {
  heading: string;
  lead: string; // line above the book title
  book: string; // catalogue slug: title, cover and price come from the book itself
  note: string; // line under the title
  cta: string;
  photo: string; // real photography behind the slide
}

/* Admin-managed later (Shopify metaobjects). Order = display order. */
const STATIC_PROMOS: Promo[]  = [
  {
    heading: "Stories that stay with you",
    lead: "Discover the magic of Udaipur in",
    book: "parth-the-promise",
    note: "A novel · Book 1 of the Duology",
    cta: "Buy now",
    photo: us("1474932430478-367dbb6832c1", 1600),
  },
  {
    heading: "Exam season, sorted",
    lead: "The prep book every aspirant keeps close",
    book: "quantitative-aptitude",
    note: "SSC · Banking · Railway",
    cta: "Shop now",
    photo: us("1497633762265-9d179a990aa6", 1600),
  },
  {
    heading: "Hindi sahitya, timeless",
    lead: "Premchand's masterpiece, for every shelf",
    book: "godan",
    note: "Classic Hindi literature",
    cta: "Shop now",
    photo: us("1526243741027-444d633d7365", 1600),
  },
];

/* Curated gift boxes — synthetic seed data until the admin creates real boxes. */
export interface GiftBox {
  slug: string;
  name: string;
  items: string[];
  price: number;
  photo: string;
  product?: string;
}

const STATIC_GIFT_BOXES: GiftBox[]  = [
  { slug: "book-lover-box", name: "Book Lover Box", items: ["1 book of your choice", "1 bookmark", "1 greeting card"], price: 599, photo: us("1512909006721-3d6018887383", 600) },
  { slug: "birthday-book-box", name: "Birthday Book Box", items: ["1 book", "1 art / craft item", "1 greeting card"], price: 699, photo: us("1513885535751-8b9238bd345a", 600) },
  { slug: "best-friend-box", name: "Best Friend Box", items: ["1 book", "1 bookmark", "1 small gift item"], price: 699, photo: us("1544947950-fa07a98d237f", 600) },
];

export const DISCOVERY_IMAGE = us("1506880018603-83d5b814b5a6", 800);
export const BUDGET_IMAGE = us("1495446815901-a7297e633e8d", 800);
export const EMPTY_SHELF_IMAGE = us("1481627834876-b7833e8f5570", 800);

/* Live content from Shopify admin (Content → Metaobjects) when synced; the static
   lists above are the fallback, so the site never renders empty. */
const C = SITE_CONTENT;
const withImages = (live: Tile[] | undefined, fallback: Tile[]): Tile[] =>
  live?.length ? live.map((t) => ({ ...t, image: t.image ?? fallback.find((f) => f.slug === t.slug)?.image })) : fallback;
export const MOODS: Tile[] = withImages(C?.moods, STATIC_MOODS);
export const EXAMS: Tile[] = withImages(C?.exams, STATIC_EXAMS);
export const CATEGORIES: Tile[] = withImages(C?.categories, STATIC_CATEGORIES);
export const BUDGETS: typeof STATIC_BUDGETS = C?.budgets?.length ? C.budgets : STATIC_BUDGETS;
export const STORES: Store[] = C?.stores?.length ? C.stores : STATIC_STORES;
export const PROMOS: Promo[] = C ? C.promos : STATIC_PROMOS;
export const GIFT_BOXES: GiftBox[] = C ? C.giftBoxes : STATIC_GIFT_BOXES;

/* Homepage section switches + top-bar messages (all on / defaults when not synced). */
const H = C?.home as Record<string, string> | null | undefined;
export const SHOW = (key: string) => (H?.[`show_${key}`] ?? "true") !== "false";
export const ANNOUNCEMENTS: string[] = H
  ? [H.announcement_1, H.announcement_2, H.announcement_3].filter(Boolean)
  : ["Free shipping on orders above ₹499", "100% original books", "Verified physical bookstores"];
