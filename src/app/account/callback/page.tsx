"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finishSignIn } from "@/lib/customer-account";

/* Shopify sends customers back here after they enter the emailed code. */
export default function AccountCallback() {
  const router = useRouter();
  const [error, setError] = useState("");
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    finishSignIn(new URLSearchParams(window.location.search))
      .then((to) => router.replace(to))
      .catch((e: Error) => setError(e.message));
  }, [router]);
  return (
    <div className="py-16 text-center">
      {error ? (
        <>
          <p className="text-[16px] font-semibold text-ink">{error}</p>
          <Link href="/account" className="mt-4 inline-block rounded-lg bg-ak-800 px-5 py-2.5 text-[14px] font-bold text-white">Try again</Link>
        </>
      ) : (
        <p className="text-[16px] text-muted">Signing you in…</p>
      )}
    </div>
  );
}
