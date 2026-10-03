import { notFound } from "next/navigation";
import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";
import { MOODS } from "@/data/taxonomy";

export function generateStaticParams() {
  return MOODS.map((m) => ({ slug: m.slug }));
}

export default async function MoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mood = MOODS.find((m) => m.slug === slug) ?? notFound();
  const books = BOOKS.filter((b) => b.moods.includes(slug));
  return <Listing title={mood.label} sub={mood.sub} books={books} />;
}
