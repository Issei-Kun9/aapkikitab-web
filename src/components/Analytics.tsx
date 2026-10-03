"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { GA_ID } from "@/lib/analytics";

export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    window.gtag("config", GA_ID, { page_path: pathname });
  }, [pathname]);
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
