import Listing from "@/components/listing";
import { BOOKS } from "@/data/books";

export default function BrowsePage() {
  return <Listing title="Browse Books" sub="The full shelf — new copies from verified physical bookstores." books={BOOKS} />;
}
