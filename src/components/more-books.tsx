"use client";

import { usePathname } from "next/navigation";
import { BestSellers } from "./storefront";

/* Short utility pages end on a shelf of trending books instead of empty space:
   it keeps the page from feeling unfinished and always offers a next step. */
const PAGES = ["/account", "/cart", "/wishlist", "/search", "/find-my-book", "/request-book", "/policies", "/checkout"];

export function MoreBooks() {
  const path = usePathname();
  if (!PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return (
    <section className="mt-14 border-t border-line pt-10 lg:mt-20">
      <BestSellers />
    </section>
  );
}
