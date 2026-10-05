/* POST /api/upload (multipart "file") → stores a photo or video with Shopify for a new post.
   Only signed-in customers can upload; the file stays unpublished until the post is approved. */
import { admin, check, configured, handle, HttpError, json, sameSite, verifyCustomer } from "../../server/shopify";

const LIMIT = { image: 10 * 1024 * 1024, video: 60 * 1024 * 1024 };
const STAGE = `mutation($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) {
  stagedTargets { url resourceUrl parameters { name value } } userErrors { message } } }`;

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  if (!configured(env)) throw new HttpError(503, "Posting is not switched on yet.");
  await verifyCustomer(env, request);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") throw new HttpError(400, "No file received.");
  const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "";
  if (!kind) throw new HttpError(400, "Only photos and videos can be added.");
  if (file.size > LIMIT[kind]) throw new HttpError(413, kind === "video" ? "Videos can be up to 60 MB." : "Photos can be up to 10 MB.");

  const d = await admin<{ stagedUploadsCreate: { stagedTargets: { url: string; resourceUrl: string; parameters: { name: string; value: string }[] }[]; userErrors: { message: string }[] } }>(
    env,
    STAGE,
    { input: [{ resource: kind === "video" ? "VIDEO" : "IMAGE", filename: file.name || `upload.${kind === "video" ? "mp4" : "jpg"}`, mimeType: file.type, httpMethod: "POST", fileSize: String(file.size) }] }
  );
  check(d.stagedUploadsCreate);
  const target = d.stagedUploadsCreate.stagedTargets[0];
  const body = new FormData();
  for (const p of target.parameters) body.append(p.name, p.value);
  body.append("file", file, file.name);
  const up = await fetch(target.url, { method: "POST", body });
  if (!up.ok) throw new HttpError(502, "Upload failed. Please try again.");
  return json({ url: target.resourceUrl, kind });
});
