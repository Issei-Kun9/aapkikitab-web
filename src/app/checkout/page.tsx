"use client";

import { useEffect, useState } from "react";
import { getBook, inr } from "@/data/books";
import { SHOPIFY_DOMAIN } from "@/data/shopify-catalog";
import { useShop } from "@/lib/store";
import { track } from "@/lib/analytics";
import { PAYMENT, shippingFor } from "@/data/settings";
import { Icon, I } from "@/components/ui";
import { DeliveryFee } from "@/components/delivery-fee";

const inputCls =
  "h-12 w-full rounded-lg border border-line bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-ak-800 focus:shadow-[0_0_0_4px_rgba(75,15,138,0.08)]";
const labelCls = "mb-1.5 block text-[13.5px] font-semibold text-ink";

export default function CheckoutPage() {
  const { cart, subtotal } = useShop();
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"online" | "cod">("online");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  /* signed-in customers: fill in what their Shopify account already knows */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ak_profile") ?? "null") as Partial<typeof form> | null;
      if (saved) setForm((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v || (saved[k as keyof typeof form] ?? "")])) as typeof form);
    } catch {
      /* nothing saved */
    }
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const lines = cart
    .map((l) => ({ line: l, book: getBook(l.slug) }))
    .filter((x) => x.book !== undefined);
  const shipping = lines.length === 0 ? 0 : shippingFor(subtotal);
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

    /* Never confirm an order the shop can't actually take: no fake "order placed" without payment. */
    setError("Some items in your cart can't be bought online right now. Please remove them or contact us.");
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
          <fieldset>
            <legend className={labelCls}>Payment method</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${method === "online" ? "border-ak-800 bg-ak-50" : "border-line bg-white hover:border-ak-600"}`}
              >
                <input type="radio" name="pay" value="online" checked={method === "online"} onChange={() => setMethod("online")} className="h-4 w-4" />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ak-800 text-white"><Icon size={18} d={I.phone} /></span>
                <span className="leading-tight">
                  <span className="block text-[14.5px] font-bold text-ink">{PAYMENT.online}</span>
                  <span className="block text-[12.5px] text-muted">Pay securely now</span>
                </span>
              </label>
              <label
                className={`flex items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${PAYMENT.cod ? (method === "cod" ? "cursor-pointer border-ak-800 bg-ak-50" : "cursor-pointer border-line bg-white hover:border-ak-600") : "cursor-not-allowed border-dashed border-line bg-paper opacity-70"}`}
                aria-disabled={!PAYMENT.cod}
              >
                <input type="radio" name="pay" value="cod" disabled={!PAYMENT.cod} checked={method === "cod"} onChange={() => setMethod("cod")} className="h-4 w-4" />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-line text-muted"><Icon size={18} d={I.truck} /></span>
                <span className="leading-tight">
                  <span className={`block text-[14.5px] font-bold ${PAYMENT.cod ? "text-ink" : "text-muted line-through"}`}>Cash on Delivery</span>
                  <span className={`block text-[12.5px] ${PAYMENT.cod ? "text-muted" : "font-bold text-rose"}`}>{PAYMENT.cod ? "Pay when it arrives" : "Not Available"}</span>
                </span>
              </label>
            </div>
          </fieldset>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" className="rounded-lg bg-ak-800 px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-ak-900">
            {method === "cod" ? "Place order" : "Pay now"} · {inr(total)}
          </button>
          <p className="text-center text-xs text-muted">
            Secure checkout · {PAYMENT.online}{PAYMENT.cod ? " · Cash on Delivery" : " · Cash on Delivery not available"}
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
            <DeliveryFee fee={shipping} />
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
