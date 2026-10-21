import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";

export default function NewPage() {
  return (
    <Listing
      title="New Arrivals"
      sub="Fresh on the shelf — new copies from verified bookstores."
      books={BOOKS.filter((b) => b.isNew)}
    />
  );
}
