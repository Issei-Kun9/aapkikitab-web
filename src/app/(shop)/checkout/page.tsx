"use client";

import { useEffect, useState } from "react";
import { getBook, inr } from "@/data/books";
import { useShop } from "@/lib/store";
import { track } from "@/lib/analytics";
import { PAYMENT, shippingFor } from "@/data/settings";
import { Icon, I } from "@/components/ui";
import { DeliveryFee } from "@/components/delivery-fee";
import { fetchMe, getSession, saveProfile, type Address } from "@/lib/account";

const inputCls =
  "h-12 w-full rounded-lg border border-line bg-white px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-ak-800 focus:shadow-[0_0_0_4px_rgba(75,15,138,0.08)]";
const labelCls = "mb-1.5 block text-[13.5px] font-semibold text-ink";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayCheckout {
  open: () => void;
  on: (event: string, fn: (r: { error?: { description?: string } }) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

const loadRazorpay = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't open the payment window. Please check your internet and try again."));
    document.head.appendChild(s);
  });

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useShop();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"online" | "cod">("online");
  const [saved, setSaved] = useState<Address[]>([]);
  const [saveAddr, setSaveAddr] = useState(true);
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "" });

  /* fill in what we already know: this device, then the signed-in account */
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("ak_profile") ?? "null") as Partial<typeof form> | null;
      if (p) setForm((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v || (p[k as keyof typeof form] ?? "")])) as typeof form);
    } catch {
      /* nothing saved */
    }
    if (getSession())
      fetchMe()
        .then((me) => {
          if (!me) return;
          setSaved(me.customer.addresses);
          const a = me.customer.addresses.find((x) => x.default) ?? me.customer.addresses[0];
          setForm((f) => ({
            ...f,
            email: f.email || me.customer.email,
            ...(a ? { name: a.name, mobile: a.phone, address: a.line, city: a.city, state: a.state, pincode: a.pincode } : { name: f.name || me.customer.name, mobile: f.mobile || me.customer.phone || "" }),
          }));
        })
        .catch(() => null);
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pickAddress = (a: Address) => setForm((f) => ({ ...f, name: a.name, mobile: a.phone, address: a.line, city: a.city, state: a.state, pincode: a.pincode }));

  const lines = cart.map((l) => ({ line: l, book: getBook(l.slug) })).filter((x) => x.book !== undefined);
  const soldOut = lines.filter(({ book }) => book!.soldOut);
  const shipping = lines.length === 0 ? 0 : shippingFor(subtotal);
  const total = subtotal + shipping;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    const mobile = form.mobile.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Please enter a valid 10-digit mobile number.");
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return setError("Please check your email address.");
    if (!form.address.trim()) return setError("Please enter your address.");
    if (!form.city.trim()) return setError("Please enter your city.");
    if (!form.state.trim()) return setError("Please enter your state.");
    if (!/^\d{6}$/.test(form.pincode.trim())) return setError("Please enter a valid 6-digit pincode.");
    if (lines.length === 0) return setError("Your cart is empty.");
    if (soldOut.length) return setError(`“${soldOut[0].book!.title}” is sold out. Please remove it from your cart.`);
    setError("");
    setBusy(true);
    try {
      localStorage.setItem("ak_profile", JSON.stringify({ ...form, mobile }));
    } catch {
      /* private mode */
    }

    try {
      const o = await postJson<{ orderId: string; number: number; total: number; razorpay: { key: string; order_id: string; amount: number; currency: string; prefill: Record<string, string> } }>("/api/checkout", {
        lines: lines.map(({ line }) => ({ handle: line.slug, qty: line.qty })),
        name: form.name.trim(),
        phone: mobile,
        email: form.email.trim(),
        address: { line: form.address.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim() },
      });
      track("begin_checkout", { value: o.total, currency: "INR" });

      // signed in? keep this address in the address book for next time
      if (saveAddr && getSession()) {
        const same = (a: Address) => a.line.trim().toLowerCase() === form.address.trim().toLowerCase() && a.pincode === form.pincode.trim();
        if (!saved.some(same))
          saveProfile({ addresses: [...saved, { id: "", name: form.name.trim(), phone: mobile, line: form.address.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(), default: saved.length === 0 }] }).catch(() => null);
      }

      const finish = async (r: RazorpayResponse) => {
        const done = await postJson<{ orderId: string }>("/api/checkout/verify", r);
        track("purchase", { value: o.total, currency: "INR", transaction_id: String(o.number) });
        clearCart();
        window.location.assign(`/account?order=${done.orderId}`);
      };

      if (o.razorpay.key === "rzp_dev") {
        // test mode on a developer's computer: pretend the payment went through
        await finish({ razorpay_order_id: o.razorpay.order_id, razorpay_payment_id: `pay_dev_${Date.now()}`, razorpay_signature: "dev_signature" });
        return;
      }

      await loadRazorpay();
      const rzp = new window.Razorpay!({
        key: o.razorpay.key,
        order_id: o.razorpay.order_id,
        amount: o.razorpay.amount,
        currency: o.razorpay.currency,
        name: "AapkiKitab",
        description: `Order #${o.number}`,
        image: `${window.location.origin}/logo.webp`,
        prefill: o.razorpay.prefill,
        notes: { order: String(o.number) },
        theme: { color: "#4a1fc4" },
        handler: (r: RazorpayResponse) => {
          finish(r).catch((err: Error) => {
            setError(err.message);
            setBusy(false);
          });
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment was not completed. You can try again — nothing was charged.");
          },
        },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description ? `Payment failed: ${r.error.description}. Please try again.` : "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">Checkout</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={pay} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          {saved.length > 1 && (
            <div>
              <p className={labelCls}>Your saved addresses</p>
              <div className="flex flex-wrap gap-2">
                {saved.map((a) => (
                  <button key={a.id} type="button" onClick={() => pickAddress(a)} className="rounded-lg border border-line px-3 py-2 text-left text-[13px] hover:border-ak-800">
                    <b>{a.name}</b> · {a.city} {a.pincode}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-name" className={labelCls}>Full name *</label>
              <input id="co-name" autoComplete="name" className={inputCls} value={form.name} onChange={set("name")} placeholder="Full name" />
            </div>
            <div>
              <label htmlFor="co-mobile" className={labelCls}>Mobile *</label>
              <input id="co-mobile" autoComplete="tel-national" className={inputCls} value={form.mobile} onChange={set("mobile")} inputMode="numeric" placeholder="10-digit mobile" />
            </div>
          </div>
          <div>
            <label htmlFor="co-email" className={labelCls}>Email (for order updates)</label>
            <input id="co-email" autoComplete="email" className={inputCls} value={form.email} onChange={set("email")} inputMode="email" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="co-address" className={labelCls}>Address *</label>
            <input id="co-address" autoComplete="street-address" className={inputCls} value={form.address} onChange={set("address")} placeholder="House no, street, landmark" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="co-city" className={labelCls}>City *</label>
              <input id="co-city" autoComplete="address-level2" className={inputCls} value={form.city} onChange={set("city")} placeholder="City" />
            </div>
            <div>
              <label htmlFor="co-state" className={labelCls}>State *</label>
              <input id="co-state" autoComplete="address-level1" className={inputCls} value={form.state} onChange={set("state")} placeholder="State" />
            </div>
            <div>
              <label htmlFor="co-pin" className={labelCls}>Pincode *</label>
              <input id="co-pin" autoComplete="postal-code" className={inputCls} value={form.pincode} onChange={set("pincode")} inputMode="numeric" placeholder="6-digit" />
            </div>
          </div>
          {getSession() && (
            <label className="flex items-center gap-2 text-[14px] text-ink">
              <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="h-4 w-4" />
              Save this address to my account
            </label>
          )}
          <fieldset>
            <legend className={labelCls}>Payment method</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${method === "online" ? "border-ak-800 bg-ak-50" : "border-line bg-white hover:border-ak-600"}`}>
                <input type="radio" name="pay" value="online" checked={method === "online"} onChange={() => setMethod("online")} className="h-4 w-4" />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ak-800 text-white"><Icon size={18} d={I.phone} /></span>
                <span className="leading-tight">
                  <span className="block text-[14.5px] font-bold text-ink">{PAYMENT.online}</span>
                  <span className="block text-[12.5px] text-muted">Pay securely now with Razorpay</span>
                </span>
              </label>
              <label
                className={`flex items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${PAYMENT.cod ? (method === "cod" ? "cursor-pointer border-ak-800 bg-ak-50" : "cursor-pointer border-line bg-white hover:border-ak-600") : "cursor-not-allowed border-dashed border-line bg-paper opacity-70"}`}
                aria-disabled={!PAYMENT.cod}
              >
                <input type="radio" name="pay" value="cod" disabled checked={false} onChange={() => setMethod("cod")} className="h-4 w-4" />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-line text-muted"><Icon size={18} d={I.truck} /></span>
                <span className="leading-tight">
                  <span className="block text-[14.5px] font-bold text-muted line-through">Cash on Delivery</span>
                  <span className="block text-[12.5px] font-bold text-rose">Not Available</span>
                </span>
              </label>
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-lg bg-ak-800 px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-ak-900 disabled:opacity-70">
            {busy ? "Opening secure payment…" : `Pay now · ${inr(total)}`}
          </button>
          <p className="text-center text-xs text-muted">🔒 Secure checkout by Razorpay · {PAYMENT.online} · Cash on Delivery not available</p>
        </form>
        <aside className="h-fit rounded-2xl border border-line bg-white p-4">
          <h2 className="font-display text-xl font-bold text-ink">Order Summary</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {lines.map(({ line, book }) => (
              <li key={line.slug} className="flex justify-between gap-2">
                <span className="truncate text-ink">
                  {book!.title} <span className="text-muted">× {line.qty}</span>
                  {book!.soldOut && <span className="ml-1 font-bold text-rose">Sold out</span>}
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
