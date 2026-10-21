"use client";
/* Orders: what to pack, what to ship, refunds. */
import { useCallback, useEffect, useState } from "react";
import { api, inr, post, when, type Order } from "./api";
import { Button, Card, cx, Empty, inputCls, PageTitle, Pill, Sheet, Spinner, useConfirm, useToast } from "./ui";

const STATUS: Record<Order["status"], { label: string; tone: "amber" | "purple" | "blue" | "green" | "grey" | "red"; emoji: string }> = {
  pending: { label: "Not paid", tone: "grey", emoji: "⏳" },
  paid: { label: "To pack", tone: "amber", emoji: "📦" },
  packed: { label: "Packed", tone: "purple", emoji: "🎁" },
  shipped: { label: "Shipped", tone: "blue", emoji: "🚚" },
  delivered: { label: "Delivered", tone: "green", emoji: "✅" },
  cancelled: { label: "Cancelled", tone: "red", emoji: "✖️" },
};
const PAY: Record<Order["payment_status"], string> = { unpaid: "Not paid", paid: "Paid", refunded: "Refunded", partially_refunded: "Part refunded", failed: "Payment failed" };

export function StatusPill({ o }: { o: Order }) {
  const s = STATUS[o.status];
  return (
    <Pill tone={s.tone}>
      {s.emoji} {s.label}
    </Pill>
  );
}

const TABS: { key: string; label: string }[] = [
  { key: "paid", label: "📦 To pack" },
  { key: "packed", label: "🎁 Packed" },
  { key: "shipped", label: "🚚 Shipped" },
  { key: "delivered", label: "✅ Delivered" },
  { key: "cancelled", label: "✖️ Cancelled" },
  { key: "", label: "All" },
];

export function OrderList() {
  const [tab, setTab] = useState("paid");
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const toast = useToast();
  const load = useCallback(() => {
    setOrders(null);
    api<{ orders: Order[] }>(`orders?status=${tab}&q=${encodeURIComponent(q)}`)
      .then((r) => setOrders(r.orders))
      .catch((e) => toast(e.message, "error"));
  }, [tab, q, toast]);
  useEffect(() => {
    const id = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  return (
    <div>
      <PageTitle title="Orders" sub="New paid orders appear under “To pack”. Open one to pack it, ship it and add tracking." />
      <div className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cx("shrink-0 rounded-full px-4 py-2 text-[14px] font-bold", tab === t.key ? "bg-ak-800 text-white" : "border border-line bg-white text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      <input className={cx(inputCls, "mb-3 max-w-md")} placeholder="🔎 Search: order number, name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} />
      {!orders ? (
        <div className="py-10 text-center text-muted">
          <Spinner /> Loading…
        </div>
      ) : !orders.length ? (
        <Empty emoji="📭" title={q ? "No orders match your search." : tab === "paid" ? "Nothing to pack right now. 🎉" : "No orders here."} />
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((o) => (
            <a key={o.id} href={`#/orders/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 hover:border-ak-600">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[16px] font-bold text-ink">#{o.number}</span>
                  <StatusPill o={o} />
                  {o.payment_status !== "paid" && <Pill tone="grey">{PAY[o.payment_status]}</Pill>}
                </span>
                <span className="mt-0.5 block truncate text-[14px] text-ink">
                  {o.name} · {o.address.city}
                </span>
                <span className="block text-[13px] text-muted">
                  {o.items.reduce((n, i) => n + i.qty, 0)} item(s) · {when(o.paid_at ?? o.created_at)}
                </span>
              </span>
              <span className="text-[16px] font-bold text-ink">{inr(o.total)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const [o, setO] = useState<Order | null>(null);
  const [busy, setBusy] = useState("");
  const [ship, setShip] = useState(false);
  const [refund, setRefund] = useState(false);
  const [note, setNote] = useState("");
  const toast = useToast();
  const { ask, dialog } = useConfirm();

  useEffect(() => {
    api<{ order: Order }>(`order?id=${id}`)
      .then((r) => {
        setO(r.order);
        setNote(r.order.note);
      })
      .catch((e) => toast(e.message, "error"));
  }, [id, toast]);

  const act = async (label: string, payload: Record<string, unknown>, done: string) => {
    setBusy(label);
    try {
      const r = await post<{ order: Order }>("order", { id, ...payload });
      setO(r.order);
      toast(done);
      return true;
    } catch (e) {
      toast((e as Error).message, "error");
      return false;
    } finally {
      setBusy("");
    }
  };

  if (!o) return <div className="py-10 text-center text-muted"><Spinner /> Loading…</div>;
  const paid = o.payment_status !== "unpaid";
  const left = o.total - o.refunded;
  const address = `${o.name}\n${o.address.line}\n${o.address.city}, ${o.address.state} ${o.address.pincode}\nPhone: ${o.phone}`;

  return (
    <div className="pb-10">
      <PageTitle title={`Order #${o.number}`} sub={`Placed ${when(o.created_at)}`} back="#/orders" action={<StatusPill o={o} />} />

      {/* next step, big and obvious */}
      {o.status !== "cancelled" && o.status !== "delivered" && paid && (
        <Card className="mb-3 border-ak-800/20 bg-ak-50">
          <p className="mb-2 text-[15px] font-bold text-ink">Next step</p>
          {o.status === "paid" && (
            <Button kind="primary" className="w-full sm:w-auto" busy={busy === "packed"} onClick={() => act("packed", { action: "status", status: "packed" }, "Marked as packed.")}>
              🎁 I have packed it
            </Button>
          )}
          {(o.status === "paid" || o.status === "packed") && (
            <Button kind={o.status === "packed" ? "primary" : "secondary"} className="mt-2 w-full sm:ml-2 sm:mt-0 sm:w-auto" onClick={() => setShip(true)}>
              🚚 Shipped — add tracking
            </Button>
          )}
          {o.status === "shipped" && (
            <Button kind="success" className="w-full sm:w-auto" busy={busy === "delivered"} onClick={() => act("delivered", { action: "status", status: "delivered" }, "Marked as delivered. The customer got an email.")}>
              ✅ It has been delivered
            </Button>
          )}
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          <Card>
            <h2 className="mb-2 text-[16px] font-bold text-ink">What they bought</h2>
            <ul className="flex flex-col gap-2">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3">
                  {i.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt="" className="h-14 w-11 shrink-0 rounded-md border border-line object-cover" />
                  ) : (
                    <span className="grid h-14 w-11 shrink-0 place-items-center rounded-md bg-ak-50">📘</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">{i.title}</span>
                    <span className="text-[13.5px] text-muted">
                      {inr(i.price)} × <b className="text-ink">{i.qty}</b>
                    </span>
                  </span>
                  <span className="font-bold">{inr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-[14.5px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{o.shipping ? inr(o.shipping) : "FREE"}</dd></div>
              <div className="flex justify-between text-[16px] font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
              {o.refunded > 0 && <div className="flex justify-between text-rose"><dt>Refunded</dt><dd>− {inr(o.refunded)}</dd></div>}
            </dl>
          </Card>

          <Card>
            <h2 className="mb-2 text-[16px] font-bold text-ink">Send to</h2>
            <p className="whitespace-pre-line text-[15px] text-ink">{address}</p>
            {o.email && <p className="mt-1 text-[14px] text-muted">{o.email}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button small kind="secondary" onClick={() => navigator.clipboard.writeText(address).then(() => toast("Address copied."))}>📋 Copy address</Button>
              <Button small kind="secondary" href={`tel:+91${o.phone}`}>📞 Call</Button>
              <Button small kind="secondary" href={`https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.name.split(" ")[0]}, this is AapkiKitab about your order #${o.number}.`)}`}>💬 WhatsApp</Button>
              <Button small kind="secondary" onClick={() => window.print()}>🖨 Print slip</Button>
            </div>
          </Card>

          {(o.courier || o.tracking_number) && (
            <Card>
              <h2 className="mb-1 text-[16px] font-bold text-ink">Tracking</h2>
              <p className="text-[15px]">{[o.courier, o.tracking_number].filter(Boolean).join(" · ")}</p>
              {o.tracking_url && <a href={o.tracking_url} target="_blank" rel="noreferrer" className="text-[14px] font-bold text-ak-800 underline">Open tracking link</a>}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Card>
            <h2 className="mb-2 text-[16px] font-bold text-ink">Payment</h2>
            <p className="text-[15px]">
              <Pill tone={o.payment_status === "paid" ? "green" : o.payment_status === "unpaid" ? "grey" : "red"}>{PAY[o.payment_status]}</Pill>
            </p>
            {o.razorpay_payment_id && <p className="mt-2 break-all text-[12.5px] text-muted">Razorpay: {o.razorpay_payment_id}</p>}
            {paid && left > 0 && (
              <Button small kind="secondary" className="mt-3" onClick={() => setRefund(true)}>
                ↩️ Give money back
              </Button>
            )}
          </Card>
          <Card>
            <h2 className="mb-2 text-[16px] font-bold text-ink">Private note</h2>
            <textarea className={cx(inputCls, "min-h-[80px]")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only your team sees this" />
            {note !== o.note && (
              <Button small className="mt-2" busy={busy === "note"} onClick={() => act("note", { action: "note", note }, "Note saved.")}>
                Save note
              </Button>
            )}
          </Card>
          <Card>
            <h2 className="mb-2 text-[16px] font-bold text-ink">History</h2>
            <ol className="flex flex-col gap-2">
              {[...o.history].reverse().map((h, i) => (
                <li key={i} className="text-[14px]">
                  <span className="block text-ink">{h.text}</span>
                  <span className="text-[12.5px] text-muted">{when(h.at)}</span>
                </li>
              ))}
            </ol>
          </Card>
          {o.status !== "cancelled" && o.status !== "delivered" && (
            <Button
              kind="danger"
              busy={busy === "cancel"}
              onClick={async () => {
                const ok = await ask("Cancel this order?", paid && left > 0 ? `The customer will get their ${inr(left)} back through Razorpay, and an email.` : "The customer will get an email.", { yes: "Cancel order", danger: true });
                if (ok) await act("cancel", { action: "status", status: "cancelled", refund: true }, "Order cancelled.");
              }}
            >
              ✖️ Cancel order
            </Button>
          )}
        </div>
      </div>

      <ShipSheet open={ship} onClose={() => setShip(false)} busy={busy === "shipped"} onShip={async (x) => (await act("shipped", { action: "status", status: "shipped", ...x }, "Marked as shipped. The customer got an email.")) && setShip(false)} />
      <RefundSheet key={`${left}-${refund}`} open={refund} onClose={() => setRefund(false)} max={left} busy={busy === "refund"} onRefund={async (amount) => (await act("refund", { action: "refund", amount }, `Refunded ${inr(amount)}.`)) && setRefund(false)} />
      {dialog}

      {/* printable packing slip */}
      <div className="hidden print:block print:fixed print:inset-0 print:z-[100] print:bg-white print:p-8">
        <h1 className="text-[22px] font-bold">AapkiKitab — Order #{o.number}</h1>
        <p className="mt-1 text-[13px]">{when(o.created_at)}</p>
        <p className="mt-4 whitespace-pre-line text-[16px] font-semibold">{address}</p>
        <table className="mt-4 w-full text-[14px]">
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id}><td className="py-1">{i.title}</td><td className="py-1 text-right">× {i.qty}</td><td className="py-1 text-right">{inr(i.price * i.qty)}</td></tr>
            ))}
            <tr><td className="pt-2 font-bold">Total paid</td><td /><td className="pt-2 text-right font-bold">{inr(o.total)}</td></tr>
          </tbody>
        </table>
        <p className="mt-6 text-[12px]">Thank you for shopping with AapkiKitab · aapkikitab.in</p>
      </div>
    </div>
  );
}

function ShipSheet({ open, onClose, onShip, busy }: { open: boolean; onClose: () => void; onShip: (x: { courier: string; tracking_number: string; tracking_url: string }) => void; busy: boolean }) {
  const [courier, setCourier] = useState("");
  const [num, setNum] = useState("");
  const [url, setUrl] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="🚚 Mark as shipped" footer={<Button className="w-full" busy={busy} onClick={() => onShip({ courier, tracking_number: num, tracking_url: url })}>Mark as shipped & email the customer</Button>}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[15px] font-bold">Courier name</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {["India Post", "Delhivery", "DTDC", "Blue Dart", "Shiprocket"].map((c) => (
              <button key={c} type="button" onClick={() => setCourier(c)} className={cx("rounded-full border-2 px-3 py-1 text-[13.5px] font-semibold", courier === c ? "border-ak-800 bg-ak-800 text-white" : "border-line")}>
                {c}
              </button>
            ))}
          </div>
          <input className={inputCls} value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Or type the courier name" />
        </div>
        <div>
          <label className="mb-1.5 block text-[15px] font-bold">Tracking number</label>
          <input className={inputCls} value={num} onChange={(e) => setNum(e.target.value)} placeholder="From the courier receipt" />
        </div>
        <div>
          <label className="mb-1.5 block text-[15px] font-bold">Tracking link (optional)</label>
          <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://…" />
        </div>
      </div>
    </Sheet>
  );
}

function RefundSheet({ open, onClose, onRefund, max, busy }: { open: boolean; onClose: () => void; onRefund: (amount: number) => void; max: number; busy: boolean }) {
  const [amount, setAmount] = useState(String(max));
  const n = Number(amount);
  return (
    <Sheet open={open} onClose={onClose} title="↩️ Give money back" footer={<Button className="w-full" busy={busy} disabled={!(n >= 1 && n <= max)} onClick={() => onRefund(n)}>Refund {inr(n || 0)}</Button>}>
      <label className="mb-1.5 block text-[15px] font-bold">How much? (up to {inr(max)})</label>
      <input className={cx(inputCls, "max-w-[200px]")} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
      <p className="mt-2 text-[14px] text-muted">The money goes back to the customer&apos;s UPI / card through Razorpay. It shows in their account in 5–7 working days. They also get an email.</p>
    </Sheet>
  );
}
