import {
  BookOfDay,
  BudgetBand,
  CategoryShelf,
  ExamStrip,
  FindNextBook,
  GiftBoxes,
  MoodPanel,
  NewArrivals,
  PromoSlider,
  ReaderReviews,
  RecentlyViewed,
  Trending,
} from "@/components/home";
import { CATEGORIES } from "@/data/taxonomy";

/* Homepage order follows the client brief (§6/§48). Sections render nothing
   when their data is empty, and the wrapper collapses with them. */
const S = "mt-10 empty:hidden lg:mt-14";

export default function Home() {
  return (
    <div className="pb-4">
      <section className="mt-4 lg:mt-6">
        <PromoSlider />
      </section>
      <section className="mt-4 empty:hidden lg:mt-6">
        <FindNextBook />
      </section>
      <section className={S}>
        <MoodPanel />
      </section>
      <section className={S}>
        <ExamStrip />
      </section>
      <section className={S}>
        <BudgetBand />
      </section>
      <section className={S}>
        <CategoryShelf tiles={CATEGORIES} />
      </section>
      <section className={S}>
        <NewArrivals />
      </section>
      <section className={S}>
        <Trending />
      </section>
      <section className={S}>
        <GiftBoxes />
      </section>
      <section className={S}>
        <BookOfDay />
      </section>
      <section className={S}>
        <ReaderReviews />
      </section>
      <section className={S}>
        <RecentlyViewed />
      </section>
    </div>
  );
}
