/* GET /api/status → which parts of the shop are switched on (the website hides what isn't). */
import { json, type Ctx } from "../../server/core";

export const onRequestGet = ({ env }: Ctx) =>
  json(
    { ready: Boolean(env.DB && env.MEDIA), payments: Boolean(env.RAZORPAY_KEY_ID || env.DEV_MODE === "1"), email: Boolean(env.RESEND_API_KEY || env.DEV_MODE === "1") },
    200,
    { "cache-control": "no-store" },
  );
