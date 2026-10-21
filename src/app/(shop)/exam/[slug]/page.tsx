import { notFound } from "next/navigation";
import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";
import { EXAMS } from "@/data/taxonomy";

export function generateStaticParams() {
  return EXAMS.map((e) => ({ slug: e.slug }));
}

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = EXAMS.find((e) => e.slug === slug) ?? notFound();
  const books = BOOKS.filter((b) => b.exams.includes(slug));
  return <Listing title={exam.label} sub={exam.sub} books={books} />;
}
