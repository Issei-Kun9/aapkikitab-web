import { BookOfDay, BudgetBand, Discovery, NewArrivals, PromoSlider, TileRow, Trending, TrustStrip } from "@/components/home";
import { Reveal } from "@/components/motion";
import { CATEGORIES, EXAMS, MOODS } from "@/data/taxonomy";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl bg-white px-4 pb-4">
      <section className="mt-8 lg:mt-12">
        <Reveal y={16}><PromoSlider /></Reveal>
      </section>
      <section className="mt-4 lg:mt-6">
        <Reveal><TrustStrip /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><Discovery /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><TileRow title="What Are You In The Mood For?" href="/browse" tiles={MOODS} /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><TileRow title="Education & Exams" href="/category/education-exams" tiles={EXAMS} /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><BudgetBand /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><TileRow title="Browse Categories" href="/browse" tiles={CATEGORIES} /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><NewArrivals /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><Trending /></Reveal>
      </section>
      <section className="mt-8 lg:mt-12">
        <Reveal><BookOfDay /></Reveal>
      </section>
    </main>
  );
}
