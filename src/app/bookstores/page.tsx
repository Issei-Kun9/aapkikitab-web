import Link from "next/link";
import { STORES } from "@/data/taxonomy";
import { Icon } from "@/components/ui";
import { monogram } from "@/lib/format";

export default function BookstoresPage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-3xl text-ink">Our Bookstores</h1>
      <p className="mt-1 text-sm text-muted">Real shops, real booksellers — every copy is new and verified.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {STORES.map((s) => (
          <article key={s.slug} className="overflow-hidden rounded-xl border border-line bg-white">
            <img src={s.photo} alt={`${s.name} bookstore`} loading="lazy" className="h-40 w-full object-cover" />
            <div className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ak-800 font-display text-lg text-white">
                {monogram(s.name)}
              </span>
              <div>
                <h2 className="font-display text-xl text-ink">{s.name}</h2>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Icon size={13} d={<><path d="M12 21s6.5-5.4 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.6 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.2" /></>} />
                  {s.location}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink/80">{s.about}</p>
            <p className="tnum mt-2 text-sm font-semibold text-ink">{s.phone}</p>
            <Link
              href={`/store/${s.slug}`}
              className="mt-4 inline-block rounded-full bg-ak-800 px-5 py-2 text-xs font-bold text-white"
            >
              VIEW STORE
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
