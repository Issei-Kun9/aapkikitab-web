/* GET  /api/posts → approved reader posts with their approved comments (pinned first, then newest)
   POST /api/posts → a signed-in customer submits a post; it waits as Draft for the team */
import { admin, check, clean, configured, CREATE_METAOBJECT, handle, HttpError, json, sameSite, verifyCustomer } from "../../server/shopify";

interface Field {
  key: string;
  value: string | null;
  reference?: { handle?: string; title?: string; featuredImage?: { url: string } | null } | null;
  references?: { nodes: Media[] } | null;
}
type Media =
  | { __typename: "MediaImage"; image: { url: string; width: number; height: number } | null }
  | { __typename: "Video"; duration: number | null; sources: { url: string; mimeType: string; height: number }[]; preview: { image: { url: string } | null } | null }
  | { __typename: string };
type OutMedia = { type: "image"; url: string; w: number; h: number } | { type: "video"; url: string; poster: string; duration: number };
type Node = { id: string; capabilities: { publishable: { status: string } | null }; fields: Field[] };

const LIST = `query List($type: String!, $after: String) {
  metaobjects(type: $type, first: 100, after: $after, sortKey: "updated_at", reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      capabilities { publishable { status } }
      fields {
        key value
        reference { ... on Product { handle title featuredImage { url } } }
        references(first: 6) { nodes {
          __typename
          ... on MediaImage { image { url width height } }
          ... on Video { duration sources { url mimeType height } preview { image { url } } }
        } }
      }
    }
  }
}`;

async function activeOf(env: Parameters<typeof admin>[0], type: string): Promise<Node[]> {
  const out: Node[] = [];
  let after: string | null = null;
  for (let page = 0; page < 5; page++) {
    const d: { metaobjects: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: Node[] } } = await admin(env, LIST, { type, after });
    for (const n of d.metaobjects.nodes) if (n.capabilities.publishable?.status === "ACTIVE") out.push(n);
    if (!d.metaobjects.pageInfo.hasNextPage) break;
    after = d.metaobjects.pageInfo.endCursor;
  }
  return out;
}

const fieldsOf = (n: Node) => Object.fromEntries(n.fields.map((x) => [x.key, x]));

function toPost(node: Node) {
  const f = fieldsOf(node);
  const media = (f.media?.references?.nodes ?? []).flatMap((m): OutMedia[] => {
    if (m.__typename === "MediaImage" && "image" in m && m.image) return [{ type: "image", url: m.image.url, w: m.image.width, h: m.image.height }];
    if (m.__typename === "Video" && "sources" in m) {
      const mp4 = m.sources.filter((s) => s.mimeType === "video/mp4").sort((a, b) => Math.abs(a.height - 720) - Math.abs(b.height - 720))[0] ?? m.sources[0];
      return mp4 ? [{ type: "video", url: mp4.url, poster: m.preview?.image?.url ?? "", duration: Math.round((m.duration ?? 0) / 1000) }] : [];
    }
    return [];
  });
  const book = f.book?.reference?.handle ? { handle: f.book.reference.handle, title: f.book.reference.title ?? "", image: f.book.reference.featuredImage?.url ?? "" } : null;
  return {
    id: node.id,
    name: f.author_name?.value || "Reader",
    text: f.text?.value ?? "",
    rating: f.rating?.value ? Number(f.rating.value) : null,
    likes: Number(f.likes?.value ?? 0) || 0,
    verified: f.verified_purchase?.value === "true",
    reply: f.team_reply?.value ?? "",
    replyLikes: Number(f.reply_likes?.value ?? 0) || 0,
    replyAt: f.reply_at?.value ?? "",
    pinned: f.featured?.value === "true",
    at: f.submitted_at?.value ?? "",
    media,
    book,
    comments: [] as { id: string; name: string; text: string; likes: number; at: string }[],
  };
}

export const onRequestGet = handle(async ({ request, env, waitUntil }) => {
  if (!configured(env)) return json({ posts: [], setup: false });
  const cache = (globalThis as unknown as { caches: { default: Cache } }).caches.default;
  const key = new Request(new URL("/api/posts?v=2", request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const [postNodes, commentNodes] = await Promise.all([activeOf(env, "ak_post"), activeOf(env, "ak_comment")]);
  const posts = postNodes.map(toPost);
  const byId = new Map(posts.map((p) => [p.id, p]));
  for (const c of commentNodes) {
    const f = fieldsOf(c);
    const post = byId.get(f.post?.value ?? "");
    if (post) post.comments.push({ id: c.id, name: f.author_name?.value || "Reader", text: f.text?.value ?? "", likes: Number(f.likes?.value ?? 0) || 0, at: f.submitted_at?.value ?? "" });
  }
  for (const p of posts) p.comments.sort((a, b) => a.at.localeCompare(b.at));
  posts.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.localeCompare(a.at));
  const res = json({ posts, setup: true }, 200, { "cache-control": "public, max-age=20" });
  waitUntil(cache.put(key, res.clone()));
  return res;
});

const FILES = `mutation($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id } userErrors { message } } }`;
const PRODUCT = `query($handle: String!) { productByIdentifier(identifier: { handle: $handle }) { id } }`;
const ORDERS = `query($id: ID!) { customer(id: $id) { numberOfOrders } }`;

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Posting is not switched on yet.");
  const customer = await verifyCustomer(env, request);
  const body = (await request.json().catch(() => ({}))) as { text?: string; rating?: number; book?: string; media?: { url: string; kind: string }[] };
  const text = clean(body.text, 500);
  if (text.length < 5) throw new HttpError(400, "Please write a few words about your experience.");
  const media = (Array.isArray(body.media) ? body.media : []).slice(0, 5).filter((m) => typeof m?.url === "string" && m.url.startsWith("https://"));

  let fileIds: string[] = [];
  if (media.length) {
    const d = await admin<{ fileCreate: { files: { id: string }[]; userErrors: { message: string }[] } }>(env, FILES, {
      files: media.map((m) => ({ originalSource: m.url, contentType: m.kind === "video" ? "VIDEO" : "IMAGE", alt: `Photo from ${customer.name}` })),
    });
    check(d.fileCreate);
    fileIds = d.fileCreate.files.map((f) => f.id);
  }

  let bookId = "";
  const handleStr = clean(body.book, 120);
  if (handleStr) bookId = (await admin<{ productByIdentifier: { id: string } | null }>(env, PRODUCT, { handle: handleStr })).productByIdentifier?.id ?? "";

  // "Verified Purchase" = this customer has at least one order with the shop
  const orders = await admin<{ customer: { numberOfOrders: string } | null }>(env, ORDERS, { id: customer.id }).catch(() => null);
  const verified = Number(orders?.customer?.numberOfOrders ?? 0) > 0;

  const rating = Number(body.rating);
  const fields = [
    { key: "author_name", value: customer.name },
    { key: "text", value: text },
    { key: "likes", value: "0" },
    { key: "verified_purchase", value: String(verified) },
    { key: "submitted_at", value: new Date().toISOString() },
    { key: "customer_email", value: customer.email },
    { key: "customer_id", value: customer.id },
    ...(rating >= 1 && rating <= 5 ? [{ key: "rating", value: String(Math.round(rating)) }] : []),
    ...(fileIds.length ? [{ key: "media", value: JSON.stringify(fileIds) }] : []),
    ...(bookId ? [{ key: "book", value: bookId }] : []),
  ];
  const d = await admin<{ metaobjectCreate: { userErrors: { message: string }[] } }>(env, CREATE_METAOBJECT, {
    input: { type: "ak_post", capabilities: { publishable: { status: "DRAFT" } }, fields },
  });
  check(d.metaobjectCreate);
  return json({ ok: true });
});
