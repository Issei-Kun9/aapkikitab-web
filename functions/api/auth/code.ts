/* POST /api/auth/code { email } → emails a 6-digit sign-in code. */
import { body, clean, handle, json, sameSite } from "../../../server/core";
import { sendCode } from "../../../server/auth";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  const b = await body(request);
  return json(await sendCode(env, clean(b.email, 200), "customer"));
});
