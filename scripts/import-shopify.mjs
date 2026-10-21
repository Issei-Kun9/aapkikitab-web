// One-time move from Shopify to the shop's own database.
// Reads products, photos, website content and policies from the Shopify Admin API and writes:
//   <out>/import.sql   → run with: wrangler d1 execute aapkikitab-db --remote --file <out>/import.sql
//   <out>/media.json   → run with: wrangler kv bulk put --namespace-id <id> <out>/media.json
// Safe to run again: rows are keyed by the Shopify id, so a re-run updates instead of duplicating.
// Usage: SHOPIFY_STORE_DOMAIN=x.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_… node scripts/import-shopify.mjs <out-dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const OUT = process.argv[2] || "import-out";
if (!DOMAIN || !TOKEN) {
  console.error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN.");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

async function gql(query, variables = {}) {
  for (let i = 0; i < 8; i++) {
    const r = await fetch(`https://${DOMAIN}/admin/api/2026-01/graphql.json`, {
      method: "POST",
      headers: { "X-Shopify-Access-Token": TOKEN, "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const j = await r.json();
    if (j.errors?.some?.((e) => e.extensions?.code === "THROTTLED") || r.status === 429) {
      await new Promise((s) => setTimeout(s, 2000));
      continue;
    }
    if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 500));
    return j.data;
  }
  throw new Error("Shopify kept saying 'slow down'");
}
async function all(query, pick, vars = {}) {
  const out = [];
  let after = null;
  do {
    const c = pick(await gql(query, { ...vars, after }));
    out.push(...c.nodes);
    after = c.pageInfo.hasNextPage ? c.pageInfo.endCursor : null;
  } while (after);
  return out;
}

const gidNum = (gid) => String(gid).split("/").pop().replace(/\D/g, "");
const idFor = (gid) => `s${gidNum(gid)}`;
const now = new Date().toISOString();

/* ---- photos: download from Shopify's CDN once, keyed by a hash of the address ---- */
const media = new Map(); // url → { key, type, size, width, height }
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
async function fetchMedia(url, { width, height, duration } = {}) {
  if (!url) return null;
  const clean = url.split("?")[0];
  if (media.has(clean)) return media.get(clean).key;
  const r = await fetch(url);
  if (!r.ok) {
    console.warn(`  could not download ${url} (${r.status})`);
    return null;
  }
  const type = (r.headers.get("content-type") || "").split(";")[0];
  const ext = EXT[type];
  if (!ext) {
    console.warn(`  skipped ${url} (type ${type})`);
    return null;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 24 * 1024 * 1024) {
    console.warn(`  skipped ${url} (too big for storage)`);
    return null;
  }
  const key = `${createHash("sha256").update(clean).digest("hex").replace(/[^a-z0-9]/g, "").slice(0, 16)}.${ext}`;
  media.set(clean, { key, type, size: buf.length, width: width ?? null, height: height ?? null, duration: duration ?? null, data: buf.toString("base64") });
  return key;
}
const refMedia = (ref) => {
  if (!ref) return null;
  if (ref.image?.url) return fetchMedia(ref.image.url, { width: ref.image.width, height: ref.image.height });
  if (ref.sources?.length) {
    const mp4 = ref.sources.filter((s) => s.mimeType === "video/mp4").sort((a, b) => Math.abs((a.height ?? 0) - 720) - Math.abs((b.height ?? 0) - 720))[0] ?? ref.sources[0];
    return fetchMedia(mp4.url, { width: mp4.width, height: mp4.height, duration: ref.duration ? Math.round(ref.duration / 1000) : null });
  }
  if (ref.url) return fetchMedia(ref.url);
  return null;
};

/* ---- HTML (Shopify descriptions and policies) → plain text the admin panel edits ---- */
const decode = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
function htmlToText(html) {
  if (!html) return "";
  let s = String(html)
    .replace(/\r/g, "")
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, t) => `\n\n## ${t.replace(/<[^>]+>/g, "").trim()}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|ul|ol)>/gi, "\n\n")
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => (t.trim() === href ? href : `${t.trim()} (${href})`))
    .replace(/<[^>]+>/g, "");
  s = decode(s)
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

/* ---- SQL ---- */
const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const sql = [];
const upsertEntry = (e) =>
  sql.push(
    `INSERT INTO entries (id, type, handle, status, position, data, created_at, updated_at) VALUES (${q(e.id)}, ${q(e.type)}, ${q(e.handle)}, ${q(e.status)}, ${Number(e.position) || 0}, ${q(JSON.stringify(e.data))}, ${q(e.created_at ?? now)}, ${q(now)})` +
      ` ON CONFLICT(id) DO UPDATE SET handle = excluded.handle, status = excluded.status, position = excluded.position, data = excluded.data, updated_at = excluded.updated_at;`,
  );

/* ---- 1. metaobject definitions tell us each field's type ---- */
const defs = (await gql(`{ metaobjectDefinitions(first: 50) { nodes { id type capabilities { publishable { enabled } } fieldDefinitions { key type { name } } } } }`)).metaobjectDefinitions.nodes.filter((d) => d.type.startsWith("ak_"));
const fieldTypes = Object.fromEntries(defs.map((d) => [d.type, Object.fromEntries(d.fieldDefinitions.map((f) => [f.key, f.type.name]))]));

/* ---- 2. products ---- */
const products = await all(
  `query($after:String){ products(first:50, after:$after){ pageInfo{hasNextPage endCursor} nodes{
    id handle title descriptionHtml vendor productType status createdAt
    variants(first:1){ nodes{ price compareAtPrice sku inventoryQuantity inventoryItem{ tracked } } }
    media(first:20){ nodes{ ... on MediaImage{ image{ url width height } } } }
    metafields(first:30){ nodes{ namespace key type value } }
  } } }`,
  (d) => d.products,
);
console.log(`products: ${products.length}`);
const productIds = new Map(products.map((p) => [p.id, idFor(p.id)]));
// metaobject ids → our ids (same rule), resolved below
const moId = (gid) => idFor(gid);

let pos = 0;
for (const p of products) {
  if (/^Untitled /.test(p.title) && !Number(p.variants.nodes[0]?.price ?? 0)) continue; // empty drafts made by accident
  const v = p.variants.nodes[0] ?? {};
  const mf = Object.fromEntries(p.metafields.nodes.filter((m) => m.namespace === "custom").map((m) => [m.key, m]));
  const list = (m) => {
    try {
      return m ? JSON.parse(m.value) : [];
    } catch {
      return [];
    }
  };
  const images = [];
  for (const m of p.media.nodes) {
    const k = await refMedia(m);
    if (k) images.push(k);
  }
  const price = Math.round(Number(v.price ?? 0));
  const mrp = Math.round(Number(v.compareAtPrice ?? 0));
  const data = {
    title: p.title,
    kind: /art\s*&\s*craft/i.test(p.productType) ? "Art & Craft" : "Book",
    ...(p.vendor && p.vendor !== "Aapki Kitab" && p.vendor !== "aapkikitab" ? { author: p.vendor } : {}),
    ...(images.length ? { images } : {}),
    price: price || 1,
    ...(mrp > price ? { mrp } : {}),
    ...(v.inventoryItem?.tracked ? { stock: Math.max(0, v.inventoryQuantity ?? 0) } : {}),
    ...(p.descriptionHtml ? { description: htmlToText(p.descriptionHtml) } : {}),
    ...(v.sku ? { isbn: v.sku } : {}),
    ...(mf.publisher ? { publisher: mf.publisher.value } : {}),
    ...(mf.pages ? { pages: Number(mf.pages.value) } : {}),
    ...(mf.language ? { language: mf.language.value } : {}),
    ...(mf.edition ? { edition: mf.edition.value } : {}),
    ...(mf.genre ? { genre: mf.genre.value } : {}),
    ...(mf.shelves ? { shelves: list(mf.shelves).map(moId) } : {}),
    ...(mf.bookstore ? { bookstore: moId(mf.bookstore.value) } : {}),
    ...(mf.highlights ? { highlights: list(mf.highlights) } : {}),
  };
  // the ₹1 test product comes across hidden; switch it on in admin for a live payment test
  const isTest = p.handle.startsWith("test-product");
  upsertEntry({ id: productIds.get(p.id), type: "product", handle: p.handle, status: p.status === "ACTIVE" && !isTest ? "active" : "draft", position: ++pos, data, created_at: p.createdAt });
}

/* ---- 3. website content (every ak_* type) ---- */
const PRIVATE_OK = new Set(["ak_post", "ak_comment", "ak_chat", "ak_message"]);
for (const d of defs) {
  const nodes = await all(
    `query($type:String!,$after:String){ metaobjects(type:$type, first:100, after:$after){ pageInfo{hasNextPage endCursor} nodes{
      id handle updatedAt capabilities{ publishable{ status } }
      fields{ key value
        reference{ __typename ... on MediaImage{ image{ url width height } } ... on Video{ duration sources{ url mimeType width height } } ... on GenericFile{ url } ... on Product{ id } ... on Metaobject{ id } }
        references(first:20){ nodes{ __typename ... on MediaImage{ image{ url width height } } ... on Video{ duration sources{ url mimeType width height } } ... on GenericFile{ url } ... on Product{ id } ... on Metaobject{ id } } }
      }
    } } }`,
    (x) => x.metaobjects,
    { type: d.type },
  );
  console.log(`${d.type}: ${nodes.length}`);
  for (const n of nodes) {
    const data = {};
    let position = 0;
    for (const f of n.fields) {
      if (f.value === null || f.value === undefined || f.value === "") continue;
      const t = fieldTypes[d.type][f.key];
      if (f.key === "position") {
        position = Number(f.value) || 0;
        data.position = position;
        continue;
      }
      if (t === "file_reference") {
        const k = await refMedia(f.reference);
        if (k) data[f.key] = k;
      } else if (t === "list.file_reference") {
        const keys = [];
        for (const r of f.references?.nodes ?? []) {
          const k = await refMedia(r);
          if (k) keys.push(k);
        }
        if (keys.length) data[f.key] = keys;
      } else if (t === "product_reference") {
        if (productIds.has(f.value)) data[f.key] = productIds.get(f.value);
      } else if (t === "metaobject_reference") data[f.key] = moId(f.value);
      else if (t === "list.metaobject_reference") data[f.key] = JSON.parse(f.value).map(moId);
      else if (t === "number_integer") data[f.key] = Number(f.value);
      else if (t === "boolean") data[f.key] = f.value === "true";
      else if (t === "json") data[f.key] = JSON.parse(f.value);
      else if (t.startsWith("list.")) data[f.key] = JSON.parse(f.value);
      else data[f.key] = f.value;
    }
    // chat photos used to be Shopify links; keep them working
    if (d.type === "ak_chat" && Array.isArray(data.messages)) {
      for (const m of data.messages) if (m.image?.startsWith("https://cdn.shopify.com/")) m.image = `/media/${await fetchMedia(m.image)}`;
    }
    const publishable = d.capabilities.publishable.enabled;
    const status = publishable ? (n.capabilities.publishable?.status === "ACTIVE" ? "active" : "draft") : "active";
    if (!PRIVATE_OK.has(d.type) && data.active === false) {
      /* kept, just hidden — same as before */
    }
    upsertEntry({ id: moId(n.id), type: d.type, handle: n.handle, status, position, data });
  }
}

/* ---- 4. policies ---- */
const pol = (await gql(`{ shop { shopPolicies { type title body } } }`)).shop.shopPolicies;
const SECTION = { SHIPPING_POLICY: "Shipping", REFUND_POLICY: "Returns & refunds", PRIVACY_POLICY: "Privacy", TERMS_OF_SERVICE: "Terms" };
let pp = 0;
// Shopify's automatic privacy policy describes Shopify; the shop now runs on its own, so it gets its own.
const contact = (await gql(`{ shop { email billingAddress { address1 city province zip } } }`)).shop;
const addr = [contact.billingAddress?.address1, contact.billingAddress?.city, contact.billingAddress?.province, contact.billingAddress?.zip].filter(Boolean).join(", ");
const PRIVACY = `Last updated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

Aapki Kitab ("we", "us") runs aapkikitab.in. This policy explains what personal information we collect, why, and how we keep it safe.

## What we collect
- **Order details:** your name, mobile number, email and delivery address, and what you buy.
- **Account details:** your email address (you sign in with a code sent to it), and any name, phone number or addresses you save.
- **Reviews and chat:** what you write or upload in Customer Reviews and in "Chat with AapkiKitab Team".
- **Basic device information:** your browser keeps your cart, wishlist and sign-in on your own device.

## How we use it
- To deliver your order, send order and delivery updates, and give refunds.
- To answer your questions and support requests.
- To show your review on the website after we approve it (only your first name and the first letter of your last name are shown).
- We do not sell your personal information to anyone.

## Payments
Payments are handled by Razorpay. Your card, UPI and bank details go straight to Razorpay and are never stored by us. Razorpay's own privacy policy applies to the payment.

## Who we share it with
- **Courier partners**, only the name, phone and address needed to deliver your parcel.
- **Service providers** that run the website for us: Razorpay (payments), Cloudflare (hosting and storage) and our email provider (sign-in codes and order emails). They may only use your information to provide their service.
- **The law:** if we are legally required to.

## Keeping it safe
Your information is stored securely and only our team can see it. Sign-in uses one-time codes, so there is no password to steal.

## Your choices
You can see your orders and addresses under My Account, and edit or remove saved addresses at any time. To ask for a copy of your information or to have it deleted, contact us below.

## Contact
Aapki Kitab${addr ? `, ${addr}` : ""}
Email: ${contact.email}`;

for (const p of pol) {
  if (!SECTION[p.type] || !p.body?.trim()) continue;
  const body = p.type === "PRIVACY_POLICY" ? PRIVACY : htmlToText(p.body);
  const title = p.type === "PRIVACY_POLICY" ? "Privacy Policy" : p.title;
  upsertEntry({ id: `policy-${p.type.toLowerCase()}`, type: "policy", handle: p.type.toLowerCase().replace(/_/g, "-"), status: "active", position: ++pp, data: { title, section: SECTION[p.type], body } });
}
console.log(`policies: ${pp}`);

/* ---- 5. photo records ---- */
for (const m of media.values())
  sql.push(
    `INSERT INTO media (key, content_type, size, width, height, duration, alt, uploaded_by) VALUES (${q(m.key)}, ${q(m.type)}, ${m.size}, ${m.width ?? "NULL"}, ${m.height ?? "NULL"}, ${m.duration ?? "NULL"}, '', 'import') ON CONFLICT(key) DO NOTHING;`,
  );

writeFileSync(`${OUT}/import.sql`, sql.join("\n") + "\n");
writeFileSync(`${OUT}/media.json`, JSON.stringify([...media.values()].map((m) => ({ key: m.key, value: m.data, base64: true, metadata: { type: m.type } }))));
console.log(`wrote ${sql.length} SQL statements and ${media.size} photos/videos to ${OUT}/`);
