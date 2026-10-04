import type { Metadata } from "next";
import { Eczar, Mukta } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/lib/store";
import { Announcement, Header, BottomNav, Footer } from "@/components/chrome";
import { Analytics } from "@/components/Analytics";

const display = Eczar({
  weight: ["500", "600", "700"],
  subsets: ["latin", "devanagari"],
  variable: "--font-eczar",
  display: "swap",
});

const sans = Mukta({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "devanagari"],
  variable: "--font-mukta",
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
