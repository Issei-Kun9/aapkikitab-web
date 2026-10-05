/* GET /api/status → whether posting and team chat are switched on (Shopify key present). */
import { configured, json, type Ctx } from "../../server/shopify";

export const onRequestGet = async ({ env }: Ctx) => json({ ready: configured(env) }, 200, { "cache-control": "public, max-age=60" });
