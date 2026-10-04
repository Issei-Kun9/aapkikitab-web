import { BookOfDay, BudgetBand, Hero, MoodShelf, NewArrivals, RecentlyViewed, TileRow, Trending } from "@/components/home";
import { CATEGORIES, EXAMS } from "@/data/taxonomy";

/* Rhythm: tight inside a section, generous between them. Content is visible
   on first paint; the hero cover fan is the page's only entrance motion. */
const S = "mt-14 empty:hidden lg:mt-20";

export default function Home() {
  return (
    <div className="pb-4">
      <section>
        <Hero />
      </section>
      <section className={S}>
        <Trending />
      </section>
      <section className={S}>
        <MoodShelf />
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
        <TileRow title="Browse categories" href="/browse" tiles={CATEGORIES.slice(0, 8)} />
      </section>
      <section className={S}>
        <RecentlyViewed />
      </section>
    </div>
  );
}
