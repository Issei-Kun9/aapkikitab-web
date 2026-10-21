/* GET /api/catalog → all active products and website content, for the website build. */
import { configured, handle, json } from "../../server/core";
import { buildCatalog } from "../../server/catalog";

export const onRequestGet = handle(async ({ env }) => {
  if (!configured(env)) return json({ error: "not set up" }, 503);
  return json(await buildCatalog(env), 200, { "cache-control": "no-store" });
});
