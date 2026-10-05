import type { Metadata } from "next";
import { CommunityFeed, ShareButton } from "@/components/community";
import { ChatButton } from "@/components/chat-button";

export const metadata: Metadata = {
  title: "Reader Stories — AapkiKitab",
  description: "Photos, videos and words from AapkiKitab readers across India.",
};

export default function CommunityPage() {
  return (
    <div className="py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ak-800">Community</p>
          <h1 className="mt-1 font-display text-[32px] font-bold leading-tight text-ink lg:text-[44px]">Reader Stories</h1>
          <p className="mt-1 max-w-xl text-[15px] text-muted">Unboxings, favourite reads and honest words from AapkiKitab readers. Every post is checked by our team.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ShareButton />
          <ChatButton />
        </div>
      </div>
      <div className="mt-6">
        <CommunityFeed />
      </div>
    </div>
  );
}
