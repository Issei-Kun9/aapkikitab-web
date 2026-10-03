import { notFound } from "next/navigation";
import { BOOKS } from "@/data/books";
import { STORES } from "@/data/taxonomy";
import { BookCard, Icon } from "@/components/ui";
import { monogram } from "@/lib/format";

export function generateStaticParams() {
  return STORES.map((s) => ({ slug: s.slug }));
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = STORES.find((s) => s.slug === slug) ?? notFound();
  const books = BOOKS.filter((b) => b.store === slug);

  return (
    <div className="py-6">
      <img
        src={store.photo}
        alt={`${store.name} bookstore`}
        loading="lazy"
        className="h-44 w-full rounded-xl border border-line object-cover sm:h-60"
      />
      <div className="mt-4 flex items-center gap-4 rounded-xl border border-line bg-white p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-ak-800 font-display text-2xl text-white">
          {monogram(store.name)}
        </span>
        <div>
          <h1 className="font-display text-3xl text-ink">{store.name}</h1>
          <p className="flex items-center gap-1 text-sm text-muted">
            <Icon size={14} d={<><path d="M12 21s6.5-5.4 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.6 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.2" /></>} />
            {store.location}
          </p>
        </div>
      </div>
      <p className="ak-prose mt-3 text-ink/80">{store.about}</p>
      <p className="tnum mt-1 text-sm font-semibold text-ink">{store.phone}</p>

      <h2 className="mb-3 mt-6 font-display text-[22px] text-ink">
        Books from this store ({books.length})
      </h2>
      {books.length === 0 ? (
        <p className="text-sm text-muted">No books listed from this store yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {books.map((b) => (
            <BookCard key={b.slug} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
