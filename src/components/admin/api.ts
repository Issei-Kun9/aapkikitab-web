/* Talking to /api/admin from the admin panel. */
export interface Entry {
  id: string;
  type: string;
  handle: string;
  status: "active" | "draft";
  position: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  number: number;
  email: string;
  name: string;
  phone: string;
  address: { line: string; city: string; state: string; pincode: string };
  items: { id: string; handle: string; title: string; price: number; qty: number; image: string }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded" | "partially_refunded" | "failed";
  razorpay_payment_id: string | null;
  refunded: number;
  courier: string;
  tracking_number: string;
  tracking_url: string;
  note: string;
  history: { at: string; text: string }[];
  created_at: string;
  paid_at: string | null;
}

export interface Setup {
  database: boolean;
  storage: boolean;
  email: boolean;
  payments: boolean;
  webhook: boolean;
  password: boolean;
  emailLogin: boolean;
  publishNow: boolean;
  dev: boolean;
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const r = await fetch(`/api/admin/${path}`, {
    ...rest,
    credentials: "same-origin",
    headers: json !== undefined ? { "content-type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (r.status === 401) window.dispatchEvent(new Event("ak-admin-signed-out"));
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

export const post = <T>(path: string, json: unknown) => api<T>(path, { method: "POST", json });
export const put = <T>(path: string, json: unknown) => api<T>(path, { method: "PUT", json });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

export const mediaSrc = (key: string) => (key ? (key.startsWith("/") || key.startsWith("http") ? key : `/media/${key}`) : "");
export const isVideo = (key: string) => /\.(mp4|webm|mov)$/i.test(key);

export const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return when(iso);
};

/* Photos are made smaller on the phone before uploading (faster, and saves storage). */
async function shrinkImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return { blob: file, width: 0, height: 0 };
  }
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { blob: file, width: 0, height: 0 };
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
  return blob && blob.size < file.size ? { blob, width: w, height: h } : { blob: file, width: bmp.width, height: bmp.height };
}

const videoInfo = (file: File) =>
  new Promise<{ width: number; height: number; duration: number }>((res) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      res({ width: v.videoWidth, height: v.videoHeight, duration: Math.round(v.duration || 0) });
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => res({ width: 0, height: 0, duration: 0 });
    v.src = URL.createObjectURL(file);
  });

export async function uploadFile(file: File, endpoint = "/api/admin/upload"): Promise<{ key: string; url: string; kind: string }> {
  const form = new FormData();
  if (file.type.startsWith("video/")) {
    if (file.size > 24 * 1024 * 1024) throw new Error("Videos can be up to 24 MB. Please choose a shorter clip.");
    const i = await videoInfo(file);
    form.append("file", file);
    form.append("width", String(i.width));
    form.append("height", String(i.height));
    form.append("duration", String(i.duration));
  } else {
    const s = await shrinkImage(file);
    const ext = s.blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
    form.append("file", new File([s.blob], `photo.${ext}`, { type: s.blob.type || file.type }));
    if (s.width) form.append("width", String(s.width));
    if (s.height) form.append("height", String(s.height));
  }
  const r = await fetch(endpoint, { method: "POST", body: form, credentials: "same-origin" });
  const j = (await r.json().catch(() => ({}))) as { key?: string; url: string; kind: string; error?: string };
  if (!r.ok) throw new Error(j.error || "Upload failed. Please try again.");
  return { key: j.key ?? j.url.replace(/^\/media\//, ""), url: j.url, kind: j.kind };
}
