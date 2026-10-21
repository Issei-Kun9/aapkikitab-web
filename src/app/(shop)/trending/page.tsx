import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";

export default function TrendingPage() {
  return (
    <Listing
      title="Trending Now"
      sub="What readers are picking up this week."
      books={BOOKS.filter((b) => b.trending)}
    />
  );
}
