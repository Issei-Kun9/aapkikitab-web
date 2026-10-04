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
import { CATEGORIES, SHOW } from "@/data/taxonomy";

/* Homepage order follows the client brief (§6/§48). Sections render nothing
   when their data is empty, and the wrapper collapses with them. */
const S = "mt-10 empty:hidden lg:mt-14";

export default function Home() {
  return (
    <div className="pb-4">
      <section className="mt-4 lg:mt-6">
        {SHOW("slider") && <PromoSlider />}
      </section>
      <section className="mt-4 empty:hidden lg:mt-6">
        {SHOW("find_book") && <FindNextBook />}
      </section>
      <section className={S}>
        {SHOW("moods") && <MoodPanel />}
      </section>
      <section className={S}>
        {SHOW("exams") && <ExamStrip />}
      </section>
      <section className={S}>
        {SHOW("budget") && <BudgetBand />}
      </section>
      <section className={S}>
        {SHOW("categories") && <CategoryShelf tiles={CATEGORIES} />}
      </section>
      <section className={S}>
        {SHOW("new_arrivals") && <NewArrivals />}
      </section>
      <section className={S}>
        {SHOW("trending") && <Trending />}
      </section>
      <section className={S}>
        {SHOW("gift_boxes") && <GiftBoxes />}
      </section>
      <section className={S}>
        {SHOW("book_of_day") && <BookOfDay />}
      </section>
      <section className={S}>
        {SHOW("reviews") && <ReaderReviews />}
      </section>
      <section className={S}>
        <RecentlyViewed />
      </section>
    </div>
  );
}
