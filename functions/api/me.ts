/* GET   /api/me → the signed-in customer, their saved addresses and orders
   PATCH /api/me { name?, phone?, addresses? } → update profile / address book */
import { body, clean, db, handle, HttpError, json, randomId, sameSite } from "../../server/core";
import { currentCustomer, requireCustomer, type Address } from "../../server/auth";
import { customerOrderView, ordersFor } from "../../server/orders";


export const onRequestGet = handle(async ({ request, env }) => {
  const c = await currentCustomer(env, request);
  if (!c) return json({ customer: null }, 200, { "cache-control": "no-store" });
  const orders = await ordersFor(env, c.id, c.email);
  return json({ customer: { email: c.email, name: c.name, phone: c.phone, addresses: c.addresses }, orders: orders.map(customerOrderView) }, 200, { "cache-control": "no-store" });
});

const pin = /^\d{6}$/;
const phone = /^[6-9]\d{9}$/;

export const onRequestPatch = handle(async ({ request, env }) => {
  sameSite(env, request);
  const c = await requireCustomer(env, request);
  const b = await body(request);
  const name = "name" in b ? clean(b.name, 80) : c.name;
  const ph = "phone" in b ? clean(b.phone, 15).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "") : c.phone;
  if (ph && !phone.test(ph)) throw new HttpError(400, "Please enter a valid 10-digit mobile number.");
  let addresses = c.addresses;
  if (Array.isArray(b.addresses)) {
    addresses = (b.addresses as Record<string, unknown>[]).slice(0, 10).map((a, i) => {
      const x: Address = {
        id: clean(a.id, 20) || randomId(8),
        name: clean(a.name, 80),
        phone: clean(a.phone, 15).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""),
        line: clean(a.line, 300),
        city: clean(a.city, 80),
        state: clean(a.state, 80),
        pincode: clean(a.pincode, 6),
        default: Boolean(a.default) || i === 0,
      };
      if (!x.name || !x.line || !x.city || !x.state) throw new HttpError(400, "Please fill in every part of the address.");
      if (!pin.test(x.pincode)) throw new HttpError(400, "Please enter a valid 6-digit pincode.");
      if (!phone.test(x.phone)) throw new HttpError(400, "Please enter a valid 10-digit mobile number for the address.");
      return x;
    });
    if (addresses.length && !addresses.some((a) => a.default)) addresses[0].default = true;
    if (addresses.filter((a) => a.default).length > 1) addresses = addresses.map((a, i) => ({ ...a, default: i === addresses.findIndex((y) => y.default) }));
  }
  await db(env).prepare("UPDATE customers SET name = ?, phone = ?, addresses = ? WHERE id = ?").bind(name, ph, JSON.stringify(addresses), c.id).run();
  return json({ ok: true, customer: { email: c.email, name, phone: ph, addresses } });
});
