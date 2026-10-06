import type { Metadata } from "next";
import { CONTACT, SHIPPING, SHOPIFY_POLICIES } from "@/data/settings";

export const metadata: Metadata = {
  title: "Policies — Aapki Kitab",
  description: "Shipping, returns, refunds, cancellations, privacy, terms and contact details for Aapki Kitab.",
};

const contactLine = CONTACT.email ? ` You can reach us at ${CONTACT.email}.` : "";

/* Used only where no policy has been written in Shopify admin (Settings → Policies). */
const DEFAULTS: { id: string; title: string; text: string }[] = [
  {
    id: "shipping",
    title: "Shipping",
    text: `${SHIPPING.dispatch.replace(/\.$/, "")}. ${SHIPPING.freeAll ? "Delivery is free on every order across India, with no minimum order." : `Shipping is a flat ₹${SHIPPING.fee}, and free on orders above ₹${SHIPPING.freeAbove}.`}`,
  },
  {
    id: "returns",
    title: "Returns, refunds & cancellations",
    text: `Every copy we sell is new. If your order arrives damaged or you receive the wrong title, write to us within ${SHIPPING.returnDays} days of delivery with your order ID and photos, and we will arrange a replacement or refund. Orders can be cancelled for a full refund until they are dispatched.${contactLine}`,
  },
  {
    id: "privacy",
    title: "Privacy",
    text: "We collect only what we need to fulfil your order: name, contact details and address. We never sell your data. Your cart and wishlist are stored only in your own browser.",
  },
  {
    id: "terms",
    title: "Terms",
    text: "Prices and availability are confirmed at checkout, which is handled securely by Shopify. By placing an order you agree to be contacted about sourcing and delivery.",
  },
];

export default function PoliciesPage() {
  const sections = DEFAULTS.map((d) => {
    const live = SHOPIFY_POLICIES.find((p) => p.id === d.id);
    return { id: d.id, title: live?.title ?? d.title, html: live?.body ?? "", text: d.text };
  });
  const nav = [...sections, { id: "contact", title: "Contact us" }];
  return (
    <div className="py-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-ink lg:text-[40px]">Policies</h1>
      <nav aria-label="Policies" className="mt-4 flex flex-wrap gap-2">
        {nav.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-white px-4 py-2 text-[14px] font-semibold text-ink hover:border-ak-800 hover:text-ak-800">
            {s.title}
          </a>
        ))}
      </nav>
      <div className="mt-5 grid max-w-3xl gap-4">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-40 rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-xl font-bold text-ink">{s.title}</h2>
            {s.html ? (
              <div
                className="ak-prose mt-2 text-ink/80 [&_a]:text-ak-800 [&_a]:underline [&_h2]:mt-5 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            ) : (
              <p className="ak-prose mt-1 text-ink/80">{s.text}</p>
            )}
          </section>
        ))}
        {/* Business contact details (Shopify: Content → Metaobjects → Shop details) */}
        <section id="contact" className="scroll-mt-40 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-xl font-bold text-ink">Contact us</h2>
          <dl className="ak-prose mt-2 grid gap-2 text-ink/80">
            {CONTACT.address && (
              <div>
                <dt className="font-semibold text-ink">Address</dt>
                <dd className="whitespace-pre-line">{CONTACT.address}</dd>
              </div>
            )}
            {CONTACT.phone && (
              <div>
                <dt className="font-semibold text-ink">Phone</dt>
                <dd><a href={CONTACT.phoneHref} className="text-ak-800 underline">{CONTACT.phone}</a></dd>
              </div>
            )}
            {CONTACT.whatsappNumber && (
              <div>
                <dt className="font-semibold text-ink">WhatsApp</dt>
                <dd><a href={`https://wa.me/${CONTACT.whatsappNumber}`} className="text-ak-800 underline">{CONTACT.whatsapp}</a></dd>
              </div>
            )}
            {CONTACT.email && (
              <div>
                <dt className="font-semibold text-ink">Email</dt>
                <dd><a href={`mailto:${CONTACT.email}`} className="text-ak-800 underline">{CONTACT.email}</a></dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}
