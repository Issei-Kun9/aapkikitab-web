"use client";

import { openChat } from "./chat";
import { Icon, I } from "./ui";

export function ChatButton({ label = "Chat with AapkiKitab Team" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => openChat()}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-ak-800/30 bg-white px-5 text-[14.5px] font-bold text-ak-800 transition-colors hover:border-ak-800"
    >
      <Icon size={18} d={I.chat} />
      {label}
    </button>
  );
}
