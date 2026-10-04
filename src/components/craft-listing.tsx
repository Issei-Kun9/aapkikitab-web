"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CRAFT } from "@/data/books";
import { CRAFT_GROUPS } from "./home";
import { CraftCard, EmptyState } from "./ui";

export default function CraftListing() {
  const type = useSearchParams().get("type");
  const groups = CRAFT_GROUPS.filter((g) => CRAFT.some((c) => c.categories.includes(g.slug)));
  const items = type ? CRAFT.filter((c) => c.categories.includes(type)) : CRAFT;
  return (
    <div className="py-8 lg:py-12">
      <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.025em] text-ink lg:text-[48px]">Art &amp; craft</h1>
      <p className="mt-2 max-w-xl text-[16px] text-muted">Paints, brushes, notebooks, journals, pens and craft kits.</p>
      <nav aria-label="Filter by type" className="mt-6 flex flex-wrap gap-2">
        <Link href="/art-craft" aria-current={!type ? "page" : undefined} className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${!type ? "bg-ak-800 text-white" : "border border-line text-ink hover:border-ak-800"}`}>
          Everything
        </Link>
        {groups.map((g) => (
          <Link key={g.slug} href={`/art-craft?type=${g.slug}`} aria-current={type === g.slug ? "page" : undefined} className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${type === g.slug ? "bg-ak-800 text-white" : "border border-line text-ink hover:border-ak-800"}`}>
            {g.label}
          </Link>
        ))}
      </nav>
      <p className="tnum mt-6 text-[14px] text-muted">{items.length} {items.length === 1 ? "item" : "items"}</p>
      {items.length === 0 ? (
        <EmptyState title="Nothing here yet" text="New art and craft supplies are on their way." cta="See everything" href="/art-craft" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((c) => (
            <CraftCard key={c.slug} item={c} />
          ))}
        </div>
      )}
    </div>
  );
}
