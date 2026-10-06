// Pulls the live catalog and all site content from the Shopify Storefront API and writes
// src/data/shopify-catalog.ts + src/data/site-content.ts. No token? Keeps the demo data.
// Usage: SHOPIFY_STORE_DOMAIN=x.myshopify.com SHOPIFY_STOREFRONT_TOKEN=shpat_... node scripts/sync-shopify.mjs
import { writeFileSync } from "node:fs";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
const out = new URL("../src/data/shopify-catalog.ts", import.meta.url);

if (!domain || !token) {
  console.log("sync-shopify: no SHOPIFY_STORE_DOMAIN/TOKEN — keeping demo catalog.");
  process.exit(0);
}

async function gql(query, variables = {}) {
  const r = await fetch(`https://${domain}/api/2026-01/graphql.json`, {
    method: "POST",
    // Headless channel's private token (shpat_…) or a public storefront token (shpsa_…)
    headers: { "Content-Type": "application/json", [token.startsWith("shpat_") ? "Shopify-Storefront-Private-Token" : "X-Shopify-Storefront-Access-Token"]: token },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

// ---- Site content managed in Shopify admin → Content → Metaobjects ----
const moQuery = `query($type: String!, $after: String) { metaobjects(type: $type, first: 100, after: $after) {
  pageInfo { hasNextPage endCursor }
  nodes { handle fields { key value reference { ... on MediaImage { image { url } } ... on Product { handle } } } } } }`;
async function fetchType(type) {
  const all = [];
  let after = null;
  try {
    do {
      const d = await gql(moQuery, { type, after });
      for (const n of d.metaobjects.nodes) {
        const o = { handle: n.handle };
        for (const f of n.fields) o[f.key] = f.reference?.image?.url ?? f.reference?.handle ?? f.value;
        all.push(o);
      }
      after = d.metaobjects.pageInfo.hasNextPage ? d.metaobjects.pageInfo.endCursor : null;
    } while (after);
  } catch (e) {
    console.error(`sync-shopify: could not read ${type} (${e.message}) — using defaults.`);
  }
  return all;
}
const on = (o) => o.active !== "false";
const byPos = (a, b) => (parseInt(a.position ?? "999", 10) || 999) - (parseInt(b.position ?? "999", 10) || 999);
const list = (v) => { try { return v ? JSON.parse(v) : []; } catch { return []; } };
const int = (v) => (v === undefined || v === null || v === "" ? undefined : parseInt(v, 10));

const [slides, tiles, budgets, gifts, stores, home, shopInfo, shortcuts, trust, promoTiles, links] = await Promise.all(
  ["ak_promo_slide", "ak_tile", "ak_budget", "ak_gift_box", "ak_bookstore", "ak_homepage", "ak_shop_info", "ak_shortcut", "ak_trust_item", "ak_promo_tile", "ak_link"].map(fetchType)
);

// Tag vocabularies come from the tiles set up in admin, so a new category / mood / exam /
// craft type added there is picked up without touching code.
const tagsOf = (kind) => tiles.filter((t) => t.kind === kind && t.tag).map((t) => t.tag.toLowerCase());
const fallback = (live, list) => (live.length ? live : list);
const MOODS = fallback(tagsOf("Mood"), ["feel", "thrill", "learn", "reflect", "love", "grow", "escape", "light"]);
const CATS = fallback(tagsOf("Category"), ["fiction", "mystery-thriller", "self-help", "hindi-literature", "english-literature", "biography-history", "children", "education-exams", "maths-science"]);
const EXAMS = tagsOf("Exam");
const CRAFT_TYPES = fallback(tagsOf("Art & Craft type"), ["art-supplies", "notebooks", "craft-kits", "pens"]);
const FLAGS = ["newarrival", "new", "bestseller", "featured", "trending", "book-of-the-day", "art-craft"];

// ---- Catalog (paged, so it keeps working past 100 products) ----
const productQuery = `query($after: String) {
  products(first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      handle title vendor tags productType
      description(truncateAt: 220)
      featuredImage { url altText }
      priceRange { minVariantPrice { amount } }
      compareAtPriceRange { minVariantPrice { amount } }
      variants(first: 1) { nodes { id sku } }
      metafields(identifiers: [
        {namespace:"custom",key:"publisher"},{namespace:"custom",key:"pages"},
        {namespace:"custom",key:"language"},{namespace:"custom",key:"edition"},
        {namespace:"custom",key:"genre"},
        {namespace:"reviews",key:"rating"},{namespace:"reviews",key:"rating_count"}
      ]) { key value }
    }
  }
}`;

let nodes = [];
try {
  let after = null;
  do {
    const d = await gql(productQuery, { after });
    nodes = nodes.concat(d.products.nodes);
    after = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (after);
} catch (e) {
  console.error(`sync-shopify: ${e.message} — keeping demo catalog.`);
  process.exit(0);
}

const books = nodes.map((p) => {
  const tags = (p.tags ?? []).map((t) => t.toLowerCase());
  const mf = Object.fromEntries((p.metafields ?? []).filter(Boolean).map((m) => [m.key, m.value]));
  const price = Math.round(parseFloat(p.priceRange?.minVariantPrice?.amount ?? "0"));
  const mrpRaw = parseFloat(p.compareAtPriceRange?.minVariantPrice?.amount ?? "0");
  const pick = (vocab) => tags.filter((t) => vocab.includes(t));
  const isNew = tags.includes("newarrival") || tags.includes("new");
  const isCraft = (p.productType ?? "").toLowerCase().replace(/\s+/g, "") === "art&craft" || tags.includes("art-craft");
  return {
    kind: isCraft ? "craft" : "book",
    slug: p.handle,
    title: p.title,
    author: p.vendor || "Aapki Kitab",
    isbn: p.variants?.nodes?.[0]?.sku ?? null,
    publisher: mf.publisher ?? "",
    pages: parseInt(mf.pages ?? "0", 10) || 0,
    language: mf.language ?? "English",
    edition: mf.edition ?? "",
    genre: mf.genre ?? "",
    price,
    mrp: mrpRaw > price ? Math.round(mrpRaw) : price,
    // Real ratings only: written by a Shopify review app into the standard reviews.* metafields.
    rating: (() => { try { return parseFloat(JSON.parse(mf.rating ?? "{}").value ?? "0") || 0; } catch { return 0; } })(),
    reviews: parseInt(mf.rating_count ?? "0", 10) || 0,
    cover: p.featuredImage?.url ?? null,
    coverTint: "#4b0f8a",
    moods: pick(MOODS),
    // Exams set up in admin are matched exactly; without any, every unrecognised tag counts.
    exams: EXAMS.length
      ? pick(EXAMS)
      : tags.filter((t) => !MOODS.includes(t) && !CATS.includes(t) && !FLAGS.includes(t) && !t.startsWith("store:")),
    categories: isCraft ? pick(CRAFT_TYPES) : pick(CATS),
    badges: [
      ...(tags.includes("bestseller") ? ["BESTSELLER"] : []),
      ...(tags.includes("featured") ? ["FEATURED"] : []),
      ...(isNew ? ["NEW"] : []),
    ],
    isNew,
    trending: tags.includes("trending") || tags.includes("bestseller"),
    bookOfDay: tags.includes("book-of-the-day"),
    variantId: (p.variants?.nodes?.[0]?.id ?? "").split("/").pop() || undefined,
    store: (tags.find((t) => t.startsWith("store:")) ?? "store:abc-bookstore").replace("store:", ""),
    blurb: p.description ?? "",
  };
});

writeFileSync(
  out,
  `// AUTO-GENERATED by scripts/sync-shopify.mjs — do not hand-edit.\n` +
    `import type { Book } from "./books";\n` +
    `export const SHOPIFY_BOOKS: Book[] = ${JSON.stringify(books, null, 2)};\n` +
    `export const SHOPIFY_DOMAIN = ${JSON.stringify(process.env.SHOPIFY_CHECKOUT_DOMAIN || domain)};\n`
);
console.log(`sync-shopify: wrote ${books.length} products.`);

// ---- Store policies (Shopify admin → Settings → Policies) ----
let policies = [];
let accountUrl = "";
try {
  const d = await gql(`{ shop { id
    shippingPolicy { title body } refundPolicy { title body } privacyPolicy { title body } termsOfService { title body } } }`);
  policies = [
    ["shipping", d.shop.shippingPolicy],
    ["returns", d.shop.refundPolicy],
    ["privacy", d.shop.privacyPolicy],
    ["terms", d.shop.termsOfService],
  ].filter(([, p]) => p?.body?.trim()).map(([id, p]) => ({ id, title: p.title, body: p.body }));
  const shopId = (d.shop.id ?? "").split("/").pop();
  if (shopId) accountUrl = `https://shopify.com/${shopId}/account`;
} catch (e) {
  console.error(`sync-shopify: could not read policies (${e.message}) — using site defaults.`);
}

const today = new Date().toISOString().slice(0, 10);
const tileOf = (kind, base) => tiles.filter((t) => t.kind === kind && on(t)).sort(byPos)
  .map((t) => ({ slug: t.tag, label: t.label, sub: t.subtitle ?? "", icon: "", href: `/${base}/${t.tag}`, ...(t.image ? { image: t.image } : {}) }));
const info = shopInfo[0] ?? null;
const content = {
  promos: slides.filter(on).filter((s) => (!s.start_date || s.start_date <= today) && (!s.end_date || s.end_date >= today)).sort(byPos)
    .map((s) => ({ heading: s.heading, lead: s.lead ?? "", book: s.book, note: s.note ?? "", cta: s.button_text || "Shop now", photo: s.photo })),
  categories: tileOf("Category", "category"),
  moods: tileOf("Mood", "mood"),
  exams: tileOf("Exam", "exam"),
  craftTypes: tiles.filter((t) => t.kind === "Art & Craft type" && on(t)).sort(byPos).map((t) => ({ slug: t.tag, label: t.label })),
  budgets: budgets.filter(on).sort(byPos).map((b) => ({ slug: b.handle, label: b.label, max: parseInt(b.max_price, 10) })),
  giftBoxes: gifts.filter(on).sort(byPos).map((g) => ({ slug: g.handle, name: g.name, items: list(g.contents), price: parseInt(g.price, 10), photo: g.photo, ...(g.product ? { product: g.product } : {}) })),
  stores: stores.filter(on).sort(byPos).map((s) => ({ slug: s.tag, name: s.name, location: s.location, about: s.about ?? "", phone: s.phone ?? "", tag: `store:${s.tag}`, photo: s.photo ?? "" })),
  home: home[0] ?? null,
  shop: info && {
    ...info,
    payment_methods: list(info.payment_methods),
    free_shipping_above: int(info.free_shipping_above),
    shipping_fee: int(info.shipping_fee),
    return_days: int(info.return_days),
  },
  shortcuts: shortcuts.filter(on).sort(byPos).map((s) => ({ label: s.label, icon: s.icon ?? "Star", href: s.link || "/browse" })),
  trust: trust.filter(on).sort(byPos).slice(0, 4).map((t) => ({ title: t.title, sub: t.subtitle ?? "", icon: t.icon ?? "Check", href: t.link ?? "" })),
  promoTiles: promoTiles.filter(on).sort(byPos).map((t) => ({ title: t.title, sub: t.subtitle ?? "", cta: t.button_text || "Shop Now", href: t.link || "/browse", photo: t.photo ?? "", colour: t.colour ?? "Lavender" })),
  links: links.filter(on).sort(byPos).map((l) => ({ label: l.label, href: l.link, placement: l.placement })),
  policies,
  accountUrl,
};
writeFileSync(
  new URL("../src/data/site-content.ts", import.meta.url),
  `// AUTO-GENERATED by scripts/sync-shopify.mjs from Shopify metaobjects — do not hand-edit.\n` +
    `export const SITE_CONTENT: Record<string, any> | null = ${JSON.stringify(content, null, 2)};\n`
);
console.log(`sync-shopify: content — ${content.promos.length} slides, ${content.categories.length + content.moods.length + content.exams.length} tiles, ${content.links.length} links, ${content.policies.length} policies.`);
