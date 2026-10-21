import type { Metadata } from "next";
import { CommunityScreen } from "@/components/community";

export const metadata: Metadata = {
  title: "Customer Reviews — AapkiKitab",
  description: "Real customers, real experiences: photos, videos and reviews from AapkiKitab readers across India.",
};

export default function CommunityPage() {
  return <CommunityScreen />;
}
