import {
  BookOfDay,
  ArtCraft,
  BudgetBand,
  CategoryShelf,
  ExamStrip,
  FindNextBook,
  GiftBoxes,
  MoodPanel,
  RecentlyViewed,
} from "@/components/home";
import { CommunityRail } from "@/components/community";
import { BestSellers, CategoryCircles, HeroCarousel, NewArrivals, PromoTiles, TrustStrip } from "@/components/storefront";
import { CATEGORIES, SHOW } from "@/data/taxonomy";

/* Storefront first (hero → shortcuts → reassurance → promos → product rails), then the
   discovery sections. Every section after the hero can be switched off in Shopify. */
const S = "mt-7 empty:hidden lg:mt-12";
const WIDE = "mt-12 empty:hidden lg:mt-20";

export default function Home() {
  return (
    <div className="pb-4 pt-2 lg:pt-6">
      <HeroCarousel />
      <section className={S}>{SHOW("categories") && <CategoryCircles />}</section>
      <section className={S}><TrustStrip /></section>
      <section className={S}><PromoTiles /></section>
      <section className={S}>{SHOW("trending") && <BestSellers />}</section>
      <section className={S}>{SHOW("new_arrivals") && <NewArrivals />}</section>
      <section className={WIDE}>{SHOW("art_craft") && <ArtCraft />}</section>
      <section className={WIDE}>{SHOW("moods") && <MoodPanel />}</section>
      <section className={WIDE}>{SHOW("exams") && <ExamStrip />}</section>
      <section className={WIDE}>{SHOW("gift_boxes") && <GiftBoxes />}</section>
      <section className={WIDE}>{SHOW("categories") && <CategoryShelf tiles={CATEGORIES} />}</section>
      <section className={WIDE}>{SHOW("budget") && <BudgetBand />}</section>
      <section className={WIDE}>{SHOW("book_of_day") && <BookOfDay />}</section>
      <section className={WIDE}>{SHOW("reviews") && <CommunityRail />}</section>
      <section className={WIDE}>{SHOW("find_book") && <FindNextBook />}</section>
      <section className={WIDE}>
        <RecentlyViewed />
      </section>
    </div>
  );
}
