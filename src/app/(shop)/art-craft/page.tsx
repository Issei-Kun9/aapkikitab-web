import type { Metadata } from "next";
import { Suspense } from "react";
import CraftListing from "@/components/craft-listing";

export const metadata: Metadata = {
  title: "Art & Craft — Aapki Kitab",
  description: "Paints, brushes, notebooks, journals, pens and craft kits from Aapki Kitab.",
};

export default function ArtCraftPage() {
  return (
    <Suspense>
      <CraftListing />
    </Suspense>
  );
}
