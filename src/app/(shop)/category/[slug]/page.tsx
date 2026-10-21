import { notFound } from "next/navigation";
import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";
import { CATEGORIES } from "@/data/taxonomy";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug) ?? notFound();
  const books = BOOKS.filter((b) => b.categories.includes(slug));
  return <Listing title={cat.label} sub={cat.sub} books={books} />;
}
