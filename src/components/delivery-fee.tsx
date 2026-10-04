import { inr } from "@/data/books";
import { DELIVERY } from "@/data/settings";

/* "Delivery Fee" row for order summaries; a free delivery gets its own celebration line. */
export function DeliveryFee({ fee }: { fee: number }) {
  return (
    <>
      <div className="flex justify-between">
        <dt className="text-muted">Delivery Fee</dt>
        <dd className={`tnum font-bold ${fee === 0 ? "text-leaf" : "text-ink"}`}>{inr(fee)}</dd>
      </div>
      {fee === 0 && (
        <div className="rounded-lg bg-leaf/10 px-3 py-2 text-center text-[13px] font-bold text-leaf">
          <dt className="sr-only">Delivery</dt>
          <dd>{DELIVERY.freeNote}</dd>
        </div>
      )}
    </>
  );
}
