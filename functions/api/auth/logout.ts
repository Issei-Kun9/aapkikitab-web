/* POST /api/auth/logout → signs the customer out. */
import { handle, json } from "../../../server/core";
import { endSession } from "../../../server/auth";

export const onRequestPost = handle(async ({ request, env }) => json({ ok: true }, 200, { "set-cookie": await endSession(env, request, "customer") }));
