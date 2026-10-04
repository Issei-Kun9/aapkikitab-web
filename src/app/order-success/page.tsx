"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";

const STEPS = ["Order Placed", "Sourcing", "Packed", "Shipped", "Delivered"];

function SuccessBody() {
  const id = useSearchParams().get("id") ?? "AK00000000";
  return (
    <div className="py-6">
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf/10 text-leaf">
          <Icon size={26} d={<path d="m5 12.5 4.5 4.5L19 7.5" />} />
        </div>
        <h1 className="mt-3 font-display text-[30px] font-bold leading-tight text-ink lg:text-[36px]">Order Confirmed</h1>
        <p className="tnum mt-1 text-sm font-bold text-ak-800">Order ID: {id}</p>
        <ol className="mt-6 flex items-start justify-between gap-1">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  i === 0 ? "bg-ak-800 text-white" : "border border-line text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-[10px] font-semibold ${i === 0 ? "text-ak-800" : "text-muted"}`}>
                {s}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-muted">Pay securely via Shopify on the live store.</p>
        <a
          href="https://aapkikitab.myshopify.com"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block w-full rounded-lg bg-ak-800 px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-ak-900"
        >
          Continue shopping
        </a>
        <Link href="/browse" className="mt-3 inline-block text-sm font-bold text-ak-800">
          Keep browsing books
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <SuccessBody />
    </Suspense>
  );
}
