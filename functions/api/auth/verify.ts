/* POST /api/auth/verify { email, code } → signs the customer in (cookie). */
import { body, clean, db, handle, json, now, sameSite } from "../../../server/core";
import { checkCode, customerByEmail, startSession } from "../../../server/auth";

export const onRequestPost = handle(async ({ request, env }) => {
  sameSite(env, request);
  const b = await body(request);
  const email = await checkCode(env, clean(b.email, 200), clean(b.code, 10), "customer");
  const c = (await customerByEmail(env, email, true))!;
  await db(env).prepare("UPDATE customers SET last_login_at = ? WHERE id = ?").bind(now(), c.id).run();
  // first sign-in after a guest order: take the name and phone from that order
  if (!c.name || !c.phone) {
    const o = await db(env).prepare("SELECT name, phone FROM orders WHERE email = ? AND status != 'pending' ORDER BY created_at DESC LIMIT 1").bind(email).first<{ name: string; phone: string }>();
    if (o) {
      c.name = c.name || o.name;
      c.phone = c.phone || o.phone;
      await db(env).prepare("UPDATE customers SET name = ?, phone = ? WHERE id = ?").bind(c.name, c.phone, c.id).run();
    }
  }
  const cookie = await startSession(env, "customer", c.id, 60);
  return json({ ok: true, customer: { email: c.email, name: c.name } }, 200, { "set-cookie": cookie });
});
