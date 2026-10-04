"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBook, inr } from "@/data/books";
import { SHOPIFY_DOMAIN } from "@/data/shopify-catalog";
import { useShop } from "@/lib/store";
import { track } from "@/lib/analytics";

const inputCls =
  "h-12 w-full rounded-lg border border-line bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-ak-800 focus:shadow-[0_0_0_4px_rgba(75,15,138,0.08)]";
const labelCls = "mb-1.5 block text-[13.5px] font-semibold text-ink";

export default function CheckoutPage() {
  const { cart, subtotal, removeFromCart } = useShop();
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const lines = cart
    .map((l) => ({ line: l, book: getBook(l.slug) }))
    .filter((x) => x.book !== undefined);
  const shipping = subtotal >= 499 || lines.length === 0 ? 0 : 49;
  const total = subtotal + shipping;

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim()))
      return setError("Please enter a valid 10-digit mobile number.");
    if (!form.address.trim()) return setError("Please enter your address.");
    if (!form.city.trim()) return setError("Please enter your city.");
    if (!form.state.trim()) return setError("Please enter your state.");
    if (!/^\d{6}$/.test(form.pincode.trim())) return setError("Please enter a valid 6-digit pincode.");
    if (lines.length === 0) return setError("Your cart is empty.");
    setError("");

    /* Live store: hand the cart to Shopify's secure checkout (UPI, cards, net banking),
       prefilled with what the customer just typed. Orders land in Shopify admin. */
    if (SHOPIFY_DOMAIN && lines.every(({ book }) => book!.variantId)) {
      const items = lines.map(({ line, book }) => `${book!.variantId}:${line.qty}`).join(",");
      const [first, ...rest] = form.name.trim().split(/\s+/);
      const q = new URLSearchParams({
        "checkout[email]": form.email.trim(),
        "checkout[shipping_address][first_name]": first ?? "",
        "checkout[shipping_address][last_name]": rest.join(" "),
        "checkout[shipping_address][address1]": form.address.trim(),
        "checkout[shipping_address][city]": form.city.trim(),
        "checkout[shipping_address][province]": form.state.trim(),
        "checkout[shipping_address][zip]": form.pincode.trim(),
        "checkout[shipping_address][country]": "India",
        "checkout[shipping_address][phone]": `+91${form.mobile.trim()}`,
      });
      track("begin_checkout", { value: total, currency: "INR" });
      window.location.assign(`https://${SHOPIFY_DOMAIN}/cart/${items}?${q.toString()}`);
      return;
    }

    const id = `AK${Date.now().toString().slice(-8)}`;
    const order = {
      id,
      total,
      items: lines.map(({ line, book }) => ({ slug: line.slug, qty: line.qty, title: book!.title })),
      customer: form,
      at: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem("ak_orders");
      const list = raw ? JSON.parse(raw) : [];
      list.push(order);
      localStorage.setItem("ak_orders", JSON.stringify(list));
    } catch {
      /* ignore */
    }
    for (const { line } of lines) removeFromCart(line.slug);
    track("purchase", { transaction_id: id, value: total, currency: "INR" });
    router.push(`/order-success?id=${id}`);
  };

  return (
    <div className="py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">Checkout</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={pay} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-name" className={labelCls}>Full name *</label>
              <input id="co-name" className={inputCls} value={form.name} onChange={set("name")} placeholder="Full name" />
            </div>
            <div>
              <label htmlFor="co-mobile" className={labelCls}>Mobile *</label>
              <input id="co-mobile" className={inputCls} value={form.mobile} onChange={set("mobile")} inputMode="numeric" placeholder="10-digit mobile" />
            </div>
          </div>
          <div>
            <label htmlFor="co-email" className={labelCls}>Email (for order updates)</label>
            <input id="co-email" className={inputCls} value={form.email} onChange={set("email")} inputMode="email" placeholder="you@example.com (optional)" />
          </div>
          <div>
            <label htmlFor="co-address" className={labelCls}>Address *</label>
            <input id="co-address" className={inputCls} value={form.address} onChange={set("address")} placeholder="House no, street, landmark" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="co-city" className={labelCls}>City *</label>
              <input id="co-city" className={inputCls} value={form.city} onChange={set("city")} placeholder="City" />
            </div>
            <div>
              <label htmlFor="co-state" className={labelCls}>State *</label>
              <input id="co-state" className={inputCls} value={form.state} onChange={set("state")} placeholder="State" />
            </div>
            <div>
              <label htmlFor="co-pin" className={labelCls}>Pincode *</label>
              <input id="co-pin" className={inputCls} value={form.pincode} onChange={set("pincode")} inputMode="numeric" placeholder="6-digit" />
            </div>
          </div>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" className="rounded-lg bg-ak-800 px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-ak-900">
            Pay now · {inr(total)}
          </button>
          <p className="text-center text-xs text-muted">
            Secure checkout · UPI · Cards · NetBanking · COD available on the live store
          </p>
        </form>
        <aside className="h-fit rounded-2xl border border-line bg-white p-4">
          <h2 className="font-display font-bold text-xl text-ink">Order Summary</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {lines.map(({ line, book }) => (
              <li key={line.slug} className="flex justify-between gap-2">
                <span className="truncate text-ink">
                  {book!.title} <span className="text-muted">× {line.qty}</span>
                </span>
                <span className="tnum shrink-0 font-semibold">{inr(book!.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tnum font-semibold">{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="tnum font-semibold">{shipping === 0 ? "Free" : inr(shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="tnum">{inr(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
