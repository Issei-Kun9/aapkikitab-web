import type { Metadata } from "next";
import { Suspense } from "react";
import { ShareExperience } from "@/components/share-experience";

export const metadata: Metadata = { title: "Share Your Experience — AapkiKitab" };

export default function SharePage() {
  return (
    <Suspense>
      <ShareExperience />
    </Suspense>
  );
}
