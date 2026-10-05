import { SITE_CONTENT } from "./site-content";

/* Everything a shop owner edits in Shopify admin (Content → Metaobjects) that isn't a
   product. Each value falls back to a sensible default, so an empty field never leaves
   a hole in the page. */

const C = SITE_CONTENT;
const H = (C?.home ?? {}) as Record<string, string | null | undefined>;
const S = (C?.shop ?? {}) as Record<string, unknown>;
const txt = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

const freeAbove = num(S.free_shipping_above, 0);
const fee = num(S.shipping_fee, 0);
export const SHIPPING = {
  freeAbove,
  fee,
  /* free on every order when there's no threshold or no fee */
  freeAll: freeAbove <= 0 || fee <= 0,
  dispatch: txt(S.dispatch_text, "Dispatched in 24–48 hours, delivered in 3–7 working days"),
  returnDays: num(S.return_days, 7),
};
export const DELIVERY = {
  headline: txt(S.delivery_headline, SHIPPING.freeAll ? "FREE DELIVERY ON EVERY ORDER" : "Free Delivery"),
  subline: txt(S.delivery_subline, SHIPPING.freeAll ? "Across India • No Minimum Order" : `On orders above ₹${freeAbove}`),
  /* shown under "Delivery Fee: ₹0" in the cart and checkout */
  freeNote: txt(S.delivery_free_note, "🎉 Enjoy FREE Delivery. It’s on us!"),
};
/* Shopify customer accounts: sign-in with an emailed one-time code, order history, addresses. */
export const ACCOUNT_URL = txt(C?.accountUrl, "https://shopify.com/100332372257/account");
export const PAYMENT = {
  online: txt(S.online_payment_label, "UPI / QR / Online Payment"),
  cod: S.cod_available === true || S.cod_available === "true",
};
export const shippingFor = (subtotal: number) => (SHIPPING.freeAll || subtotal >= SHIPPING.freeAbove || subtotal === 0 ? 0 : SHIPPING.fee);

const digits = (v: string) => v.replace(/[^\d]/g, "");
const phone = txt(S.contact_phone, "");
const whatsapp = txt(S.contact_whatsapp, "");
export const CONTACT = {
  phone,
  phoneHref: phone ? `tel:+${digits(phone)}` : "",
  whatsapp,
  whatsappNumber: digits(whatsapp),
  email: txt(S.contact_email, ""),
  address: txt(S.contact_address, ""),
};

export const FOOTER = {
  about: txt(S.footer_about, "An independent online bookshop. Original books from real Indian bookshops, at honest prices."),
  newsletter: txt(S.newsletter_heading, "New arrivals, every Sunday"),
  payments: Array.isArray(S.payment_methods) && S.payment_methods.length ? (S.payment_methods as string[]) : ["UPI", "QR Code", "Online Payment"],
  copyright: txt(S.copyright_text, `© ${new Date().getFullYear()} Aapki Kitab. Made in India.`),
  social: [
    { label: "Instagram", href: txt(S.instagram, "") },
    { label: "Facebook", href: txt(S.facebook, "") },
    { label: "YouTube", href: txt(S.youtube, "") },
  ].filter((s) => s.href),
};

export const SEO = {
  title: txt(S.seo_title, "AapkiKitab — Books, Gifts, Art & Craft"),
  description: txt(
    S.seo_description,
    "Books, gifts, art & craft and stationery from real Indian bookshops. Discover books by mood, interest, exam and budget."
  ),
};

export const HEADER = {
  tagline: txt(H.header_tagline, "Made for India. Made for You."),
  searchPlaceholder: txt(H.search_placeholder, "Search for books, gifts, art & craft..."),
  deliveryPlace: txt(H.default_delivery_place, "Udaipur, 313001"),
};

export const HERO = {
  eyebrow: txt(H.hero_eyebrow, "Discover stories"),
  title: txt(H.hero_title, "Books for a Better You"),
  lines: txt(H.hero_lines, "Fiction | Self-Help | Academic\nGifts | Art & Craft | Stationery").split(/\n+/).map((l) => l.trim()).filter(Boolean),
  cta: txt(H.hero_button_text, "Shop Now"),
  href: txt(H.hero_button_link, "/browse"),
  photo: txt(H.hero_photo, unsplash("1512820790803-83ca734da794")),
  book: txt(H.hero_book, ""),
};

export const HEADINGS = {
  bestSellers: txt(H.best_sellers_title, "Best Sellers"),
  newArrivals: txt(H.new_arrivals_title, "New Arrivals"),
};

export const ANNOUNCEMENTS: string[] = [H.announcement_1, H.announcement_2, H.announcement_3]
  .map((t) => (typeof t === "string" ? t.trim() : ""))
  .filter(Boolean);

export interface Shortcut { label: string; icon: string; href: string }
export const SHORTCUTS: Shortcut[] = C?.shortcuts?.length
  ? C.shortcuts
  : [
      { label: "Books", icon: "Books", href: "/browse" },
      { label: "Gifts", icon: "Gifts", href: "/#gift-boxes" },
      { label: "Art & Craft", icon: "Art & Craft", href: "/art-craft" },
      { label: "Stationery", icon: "Stationery", href: "/art-craft?type=notebooks" },
      { label: "Exams", icon: "Exams", href: "/category/education-exams" },
      { label: "More", icon: "Star", href: "/browse" },
    ];

export interface TrustItem { title: string; sub: string; icon: string; href: string }
export const TRUST: TrustItem[] = C?.trust?.length
  ? C.trust
  : [
      { title: "Free Delivery", sub: SHIPPING.freeAll ? "Every Order" : `Above ₹${SHIPPING.freeAbove}`, icon: "Truck", href: "" },
      { title: "Secure Payments", sub: "100% Safe", icon: "Shield", href: "" },
      { title: "Easy Returns", sub: `${SHIPPING.returnDays} Days`, icon: "Box", href: "/policies" },
      { title: "Customer Support", sub: "Always Here", icon: "Headset", href: "/request-book" },
    ];

export interface PromoTile { title: string; sub: string; cta: string; href: string; photo: string; colour: string }
export const PROMO_TILES: PromoTile[] = C?.promoTiles?.length
  ? C.promoTiles.map((t: PromoTile, i: number) => ({
      ...t,
      photo: t.photo || (i % 2 === 0 ? unsplash("1495446815901-a7297e633e8d", 600) : unsplash("1512909006721-3d6018887383", 600)),
    }))
  : [
      { title: "Best Selling Books", sub: "", cta: "Explore Now", href: "/trending", photo: unsplash("1495446815901-a7297e633e8d", 600), colour: "Peach" },
      { title: "Unique Gifts", sub: "For Every Occasion", cta: "Shop Now", href: "/#gift-boxes", photo: unsplash("1512909006721-3d6018887383", 600), colour: "Lavender" },
    ];

export interface NavLink { label: string; href: string }
const LIVE_LINKS: (NavLink & { placement: string })[] = C?.links ?? [];
const linksFor = (placement: string, fallback: NavLink[]): NavLink[] => {
  const live = LIVE_LINKS.filter((l) => l.placement === placement && l.label && l.href);
  return live.length ? live : fallback;
};
export const HEADER_LINKS = linksFor("Header menu", [
  { label: "New Arrivals", href: "/new" },
  { label: "Bestsellers", href: "/trending" },
  { label: "Art & Craft", href: "/art-craft" },
  { label: "Offers", href: "/offers" },
  { label: "Bookstores", href: "/bookstores" },
]);
export const FOOTER_COLUMNS: { h: string; links: NavLink[] }[] = [
  {
    h: "Shop",
    links: linksFor("Footer – Shop", [
      { label: "All books", href: "/browse" },
      { label: "New arrivals", href: "/new" },
      { label: "Bestsellers", href: "/trending" },
      { label: "Art & craft", href: "/art-craft" },
      { label: "Offers", href: "/offers" },
    ]),
  },
  {
    h: "Discover",
    links: linksFor("Footer – Discover", [
      { label: "Find my book", href: "/find-my-book" },
      { label: "Exams & education", href: "/category/education-exams" },
      { label: "Partner bookshops", href: "/bookstores" },
      { label: "Request a book", href: "/request-book" },
      { label: "Reader stories", href: "/community" },
    ]),
  },
  {
    h: "Help",
    links: linksFor("Footer – Help", [
      { label: "Contact us", href: "/request-book" },
      { label: "Shipping", href: "/policies#shipping" },
      { label: "Returns & refunds", href: "/policies#returns" },
      { label: "Privacy & terms", href: "/policies#privacy" },
    ]),
  },
];

export const CRAFT_TYPES: { slug: string; label: string }[] = C?.craftTypes?.length
  ? C.craftTypes
  : [
      { slug: "art-supplies", label: "Art supplies" },
      { slug: "notebooks", label: "Notebooks & journals" },
      { slug: "craft-kits", label: "Craft kits" },
      { slug: "pens", label: "Pens" },
    ];

export interface Policy { id: string; title: string; body: string }
/* Policies written in Shopify admin (Settings → Policies) are HTML; ours are plain text. */
export const SHOPIFY_POLICIES: Policy[] = C?.policies ?? [];

/* Section switches: on unless switched off in admin. */
export const SHOW = (key: string) => (H[`show_${key}`] ?? "true") !== "false";

/* Messages to the shop go out on the owner's own channels: WhatsApp first, then email. */
export const waLink = (text: string) =>
  CONTACT.whatsappNumber ? `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}` : "";
export const mailLink = (subject: string, body: string) =>
  CONTACT.email ? `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : "";
