"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { inr } from "@/data/books";
import { Icon } from "@/components/ui";

interface Order {
  id: string;
  total: number;
  items: { slug: string; qty: number; title: string }[];
  at: string;
}

const ROWS = ["My Orders", "Wishlist", "Account Details", "Saved Address", "Logout"];

export default function AccountPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ak_orders");
      if (raw) setOrders(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="py-6">
      <h1 className="font-display text-3xl text-ink">My Account</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[280px_1fr]">
        <nav className="h-fit overflow-hidden rounded-xl border border-line bg-white">
          {ROWS.map((r) => (
            <Link
              key={r}
              href={r === "Wishlist" ? "/wishlist" : "/account"}
              className="flex items-center justify-between border-b border-line px-4 py-3 text-sm font-semibold text-ink last:border-0 hover:bg-ak-50"
            >
              {r}
              <Icon size={15} d={<path d="M4 12h15m-6-6 6 6-6 6" />} />
            </Link>
          ))}
        </nav>
        <div className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-xl text-ink">My Orders</h2>
          {orders.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              You have not placed any orders yet. Your orders will appear here.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between text-sm">
                    <Link href={`/order-success?id=${o.id}`} className="font-bold text-ak-800">
                      {o.id}
                    </Link>
                    <span className="tnum font-bold">{inr(o.total)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {o.items.reduce((n, i) => n + i.qty, 0)} items ·{" "}
                    {new Date(o.at).toLocaleDateString("en-IN")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
