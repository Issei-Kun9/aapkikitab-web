import type { Metadata } from "next";
import { Rozha_One, Mukta } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/lib/store";
import { Announcement, Header, BottomNav, Footer } from "@/components/chrome";
import { Analytics } from "@/components/Analytics";

const display = Rozha_One({
  weight: "400",
  subsets: ["latin", "devanagari"],
  variable: "--font-display",
  display: "swap",
});

const sans = Mukta({
  weight: ["400", "600", "700"],
  subsets: ["latin", "devanagari"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aapki Kitab — Your Next Book Awaits",
  description: "A premium independent online bookstore. Discover books by mood, interest, exam and budget.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans" data-astryx-theme="neutral">
        <Analytics />
        <ShopProvider>
          <Announcement />
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 lg:pb-10">{children}</main>
          <Footer />
          <BottomNav />
        </ShopProvider>
      </body>
    </html>
  );
}
