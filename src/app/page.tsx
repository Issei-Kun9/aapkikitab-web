import { BookOfDay, BudgetBand, Discovery, FeaturedAuthors, Hero, NewArrivals, PromoSlider, RecentlyViewed, TileRow, Trending } from "@/components/home";
import { CATEGORIES, EXAMS, MOODS } from "@/data/taxonomy";

/* Rhythm: tight inside a section, generous between them. Content is visible
   on first paint; the hero cover fan is the page's only entrance motion. */
const S = "mt-14 lg:mt-20";

export default function Home() {
  return (
    <div className="pb-4">
      <section className="mt-4 lg:mt-6">
        <Hero />
      </section>
      <section className={S}>
        <Trending />
      </section>
      <section className={S}>
        <TileRow title="What are you in the mood for?" href="/browse" tiles={MOODS} />
      </section>
      <section className={S}>
        <PromoSlider />
      </section>
      <section className={S}>
        <NewArrivals />
      </section>
      <section className={S}>
        <BudgetBand />
      </section>
      <section className={S}>
        <TileRow title="Exams & education" href="/category/education-exams" tiles={EXAMS} />
      </section>
      <section className={S}>
        <BookOfDay />
      </section>
      <section className={S}>
        <TileRow title="Browse categories" href="/browse" tiles={CATEGORIES} />
      </section>
      <section className={S}>
        <FeaturedAuthors />
      </section>
      <section className={S}>
        <Discovery />
      </section>
      <section className={S}>
        <RecentlyViewed />
      </section>
    </div>
  );
}
