import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";

export default function OffersPage() {
  const books = BOOKS.filter((b) => b.mrp > b.price).sort(
    (a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp
  );
  return (
    <Listing title="Offers" sub="Honest discounts on new copies — biggest savings first." books={books} />
  );
}
