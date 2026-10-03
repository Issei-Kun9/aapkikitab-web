const SECTIONS = [
  {
    h: "Shipping",
    p: "Orders are dispatched from our partner bookstores within 24–48 hours. Shipping is a flat ₹49, and free on orders above ₹499. Delivery usually takes 3–7 working days depending on your pincode.",
  },
  {
    h: "Returns",
    p: "Every copy we sell is new. If your book arrives damaged or you receive the wrong title, write to us within 7 days of delivery with your order ID and photos, and we will arrange a replacement or refund.",
  },
  {
    h: "Privacy",
    p: "We collect only what we need to fulfil your order — name, contact and address. We never sell your data. Demo features on this site store carts, wishlists and requests only in your own browser (localStorage).",
  },
  {
    h: "Terms",
    p: "Prices and availability shown here are from our demo catalog and may differ on the live Shopify store, which is the final source of truth at checkout. By placing an order you agree to be contacted about sourcing and delivery.",
  },
];

export default function PoliciesPage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-3xl text-ink">Policies</h1>
      <div className="mt-4 grid max-w-3xl gap-4">
        {SECTIONS.map((s) => (
          <section key={s.h} className="rounded-xl border border-line bg-white p-5">
            <h2 className="font-display text-xl text-ink">{s.h}</h2>
            <p className="ak-prose mt-1 text-ink/80">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
