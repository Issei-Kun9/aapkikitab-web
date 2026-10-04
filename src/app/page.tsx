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
import { ShelfHero } from "@/components/shelf-hero";
import { CATEGORIES, SHOW } from "@/data/taxonomy";

/* Rhythm: dark hero → light → dark band → light → marigold band → light → dark
   spread → light. Full-bleed bands carry their own padding; light sections sit
   in the content column. Every section can be switched off in Shopify. */
const S = "mt-16 empty:hidden lg:mt-24";
const BAND = "mt-16 empty:hidden lg:mt-24";

export default function Home() {
  return (
    <div className="pb-4">
      <ShelfHero />
      <section className={S}>{SHOW("moods") && <MoodPanel />}</section>
      <section className={S}>{SHOW("trending") && <Trending />}</section>
      <section className={S}>{SHOW("slider") && <PromoSlider />}</section>
      <section className={S}>{SHOW("categories") && <CategoryShelf tiles={CATEGORIES} />}</section>
      <section className={BAND}>{SHOW("exams") && <ExamStrip />}</section>
      <section className={S}>{SHOW("new_arrivals") && <NewArrivals />}</section>
      <section className={BAND}>{SHOW("budget") && <BudgetBand />}</section>
      <section className={S}>{SHOW("gift_boxes") && <GiftBoxes />}</section>
      <section className={BAND}>{SHOW("book_of_day") && <BookOfDay />}</section>
      <section className={S}>{SHOW("reviews") && <ReaderReviews />}</section>
      <section className={S}>{SHOW("find_book") && <FindNextBook />}</section>
      <section className={S}>
        <RecentlyViewed />
      </section>
    </div>
  );
}
