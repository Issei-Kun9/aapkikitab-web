/* Emails via Resend (resend.com): sign-in codes, order updates and alerts for the shop team. */
import { HttpError, originOf, type Env } from "./core";

export interface Mail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(env: Env, mail: Mail) {
  if (!env.RESEND_API_KEY) {
    if (env.DEV_MODE === "1") {
      console.log(`[email to ${mail.to}] ${mail.subject}\n${mail.text}`);
      return;
    }
    throw new HttpError(503, "Email is not set up yet. Please try again later.");
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM || "AapkiKitab <orders@aapkikitab.in>",
      to: Array.isArray(mail.to) ? mail.to : [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
  });
  if (!r.ok) {
    console.error("email failed", r.status, await r.text().catch(() => ""));
    throw new HttpError(502, "We couldn't send the email. Please try again.");
  }
}

/* Alerts must never break the customer's action. */
export async function sendQuietly(env: Env, mail: Mail) {
  try {
    await sendEmail(env, mail);
  } catch (e) {
    console.error("alert email not sent", e);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function layout(title: string, bodyHtml: string, env?: Env) {
  const site = env ? originOf(env) : "https://aapkikitab.in";
  return `<!doctype html><html><body style="margin:0;background:#f6f0ff;font-family:Arial,Helvetica,sans-serif;color:#2b2140">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden" cellpadding="0" cellspacing="0">
<tr><td style="background:#4b0f8a;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold">AapkiKitab</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 14px;font-size:20px;color:#2a0a52">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#faf7ff;color:#7a6a96;font-size:12px">Made for India. Made for You. · <a href="${site}" style="color:#6b21c8">aapkikitab.in</a></td></tr>
</table></td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${s}</p>`;
const button = (href: string, label: string) =>
  `<p style="margin:18px 0"><a href="${href}" style="background:#6b21c8;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;

export function codeEmail(code: string, purpose: "customer" | "admin"): Omit<Mail, "to"> {
  const what = purpose === "admin" ? "open the AapkiKitab admin panel" : "sign in to AapkiKitab";
  return {
    subject: `${code} is your AapkiKitab sign-in code`,
    text: `Your code to ${what} is ${code}. It works for 10 minutes. If you didn't ask for it, you can ignore this email.`,
    html: layout(
      "Your sign-in code",
      p(`Use this code to ${what}:`) +
        `<p style="margin:8px 0 18px;font-size:34px;letter-spacing:8px;font-weight:bold;color:#4b0f8a">${code}</p>` +
        p("It works for 10 minutes. If you didn't ask for it, you can ignore this email."),
    ),
  };
}

export interface OrderForMail {
  id: string;
  number: number;
  name: string;
  email: string;
  phone: string;
  address: { line: string; city: string; state: string; pincode: string };
  items: { title: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  courier?: string;
  tracking_number?: string;
  tracking_url?: string;
  refunded?: number;
}

const itemsTable = (o: OrderForMail) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0 14px">` +
  o.items.map((i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(i.title)} × ${i.qty}</td><td align="right" style="padding:6px 0;border-bottom:1px solid #eee">${inr(i.price * i.qty)}</td></tr>`).join("") +
  `<tr><td style="padding:6px 0;color:#7a6a96">Delivery</td><td align="right" style="padding:6px 0;color:#7a6a96">${o.shipping ? inr(o.shipping) : "FREE"}</td></tr>` +
  `<tr><td style="padding:6px 0;font-weight:bold">Total paid</td><td align="right" style="padding:6px 0;font-weight:bold">${inr(o.total)}</td></tr></table>`;

const addressHtml = (o: OrderForMail) => esc(`${o.name}, ${o.address.line}, ${o.address.city}, ${o.address.state} ${o.address.pincode} · ${o.phone}`);

export function orderPlacedEmail(env: Env, o: OrderForMail): Omit<Mail, "to"> {
  return {
    subject: `Order #${o.number} confirmed — thank you!`,
    text: `Hi ${o.name}, thank you for your order #${o.number} (${inr(o.total)}). We'll pack it within 24–48 hours and email you the tracking details.`,
    html: layout(
      `Thank you, ${o.name.split(" ")[0]}!`,
      p(`Your order <b>#${o.number}</b> is confirmed. We'll pack it within 24–48 hours and email you when it's on the way.`) +
        itemsTable(o) +
        p(`<b>Delivering to:</b> ${addressHtml(o)}`) +
        button(`${originOf(env)}/account?order=${o.id}`, "View my order"),
      env,
    ),
  };
}

export function newOrderAlert(env: Env, o: OrderForMail): Omit<Mail, "to"> {
  return {
    subject: `🛍️ New order #${o.number} — ${inr(o.total)}`,
    text: `New paid order #${o.number} from ${o.name} (${o.phone}) for ${inr(o.total)}. Open the admin panel to pack it.`,
    html: layout(
      `New order #${o.number}`,
      p(`<b>${esc(o.name)}</b> paid <b>${inr(o.total)}</b>.`) + itemsTable(o) + p(`<b>Ship to:</b> ${addressHtml(o)}`) + button(`${originOf(env)}/admin#/orders/${o.id}`, "Open the order"),
      env,
    ),
  };
}

export function shippedEmail(env: Env, o: OrderForMail): Omit<Mail, "to"> {
  const track = o.tracking_url || "";
  const line = [o.courier, o.tracking_number].filter(Boolean).join(" · ");
  return {
    subject: `Your order #${o.number} is on the way 🚚`,
    text: `Good news! Order #${o.number} has been shipped${line ? ` (${line})` : ""}.${track ? ` Track it: ${track}` : ""}`,
    html: layout(
      "Your order is on the way!",
      p(`Order <b>#${o.number}</b> has been shipped.`) +
        (line ? p(`<b>Courier / tracking:</b> ${esc(line)}`) : "") +
        (track ? button(track, "Track my parcel") : button(`${originOf(env)}/account?order=${o.id}`, "View my order")),
      env,
    ),
  };
}

export function deliveredEmail(env: Env, o: OrderForMail): Omit<Mail, "to"> {
  return {
    subject: `Order #${o.number} delivered — enjoy your reading! 📚`,
    text: `Your order #${o.number} has been delivered. We'd love to hear what you think — share a review on aapkikitab.in/community.`,
    html: layout(
      "Delivered! Happy reading 📚",
      p(`Your order <b>#${o.number}</b> has been delivered.`) + p("Loved it? Share a photo or a few words — it helps other readers.") + button(`${originOf(env)}/community/share`, "Write a review"),
      env,
    ),
  };
}

export function refundEmail(env: Env, o: OrderForMail, amount: number): Omit<Mail, "to"> {
  return {
    subject: `Refund of ${inr(amount)} for order #${o.number}`,
    text: `We've refunded ${inr(amount)} for order #${o.number} to your original payment method. It usually shows in 5–7 working days.`,
    html: layout("Your refund is on its way", p(`We've refunded <b>${inr(amount)}</b> for order <b>#${o.number}</b> to your original payment method.`) + p("It usually shows in your bank or UPI app within 5–7 working days."), env),
  };
}

export function cancelledEmail(env: Env, o: OrderForMail): Omit<Mail, "to"> {
  return {
    subject: `Order #${o.number} cancelled`,
    text: `Your order #${o.number} has been cancelled. If you paid, the refund goes back to your original payment method within 5–7 working days.`,
    html: layout("Your order was cancelled", p(`Order <b>#${o.number}</b> has been cancelled.`) + p("If you paid, the money goes back to your original payment method within 5–7 working days."), env),
  };
}

export function teamAlert(env: Env, subject: string, lines: string[], link: string): Omit<Mail, "to"> {
  return { subject, text: `${lines.join("\n")}\n${originOf(env)}${link}`, html: layout(subject, lines.map((l) => p(esc(l))).join("") + button(`${originOf(env)}${link}`, "Open the admin panel"), env) };
}
