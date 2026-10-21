import { notFound } from "next/navigation";
import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";
import { BUDGETS } from "@/data/taxonomy";

export function generateStaticParams() {
  return BUDGETS.map((b) => ({ slug: b.slug }));
}

export default async function BudgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const band = BUDGETS.find((b) => b.slug === slug) ?? notFound();
  const books = BOOKS.filter((b) => b.price <= band.max);
  return <Listing title={band.label} sub="New copies within your budget." books={books} />;
}
