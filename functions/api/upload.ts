/* POST /api/upload (multipart "file", optional width/height/duration) → stores a photo or video
   for a review or chat. Only signed-in customers can upload. */
import { handle, HttpError, json, sameSite } from "../../server/core";
import { requireCustomer } from "../../server/auth";
import { saveMedia } from "../../server/media";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  const c = await requireCustomer(env, request);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") throw new HttpError(400, "No file received.");
  const n = (k: string) => {
    const v = Number(form?.get(k));
    return Number.isFinite(v) && v > 0 ? Math.round(v) : undefined;
  };
  const m = await saveMedia(env, file, { uploadedBy: `customer:${c.id}`, allowVideo: form?.get("attach") !== "1", width: n("width"), height: n("height"), duration: n("duration"), alt: `From ${c.email.split("@")[0]}` });
  return json({ url: m.url, kind: m.kind });
});
