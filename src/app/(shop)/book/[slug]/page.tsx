import { notFound } from "next/navigation";
import { PRODUCTS, getBook } from "@/data/books";
import { STORES } from "@/data/taxonomy";
import BookDetail from "@/components/book-detail";

export function generateStaticParams() {
  return PRODUCTS.map((b) => ({ slug: b.slug }));
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = getBook(slug) ?? notFound();
  const store = STORES.find((s) => s.slug === book.store);
  const related = PRODUCTS.filter(
    (b) => b.slug !== book.slug && b.kind === book.kind && b.categories.some((c) => book.categories.includes(c))
  ).slice(0, 6);
  return <BookDetail book={book} store={store} related={related} />;
}
