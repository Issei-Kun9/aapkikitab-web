import type { Metadata } from "next";
import { Literata, Mukta, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/lib/store";
import { Announcement, Header, BottomNav, Footer } from "@/components/chrome";
import { Analytics } from "@/components/Analytics";
import { MoreBooks } from "@/components/more-books";

/* Literata was drawn for long-form reading on screens — a bookseller's typeface.
   Tiro Devanagari carries the bilingual moments; Mukta runs the interface. */
const display = Literata({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-literata",
  display: "swap",
});

const deva = Tiro_Devanagari_Hindi({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-deva",
  display: "swap",
});

const sans = Mukta({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "devanagari"],
  variable: "--font-mukta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aapkikitab.in"),
  title: "Aapki Kitab — Your Next Book Awaits",
  description: "A premium independent online bookstore. Discover books by mood, interest, exam and budget.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${deva.variable} ${sans.variable}`}>
      <head>
        {/* One official address: www and the pages.dev preview hop to aapkikitab.in, same path. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(/^(www\\.aapkikitab\\.in|aapkikitab\\.pages\\.dev)$/.test(location.hostname))location.replace("https://aapkikitab.in"+location.pathname+location.search+location.hash)`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <Analytics />
        <ShopProvider>
          <Announcement />
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 lg:pb-10">
            {children}
            <MoreBooks />
          </main>
          <Footer />
          <BottomNav />
        </ShopProvider>
      </body>
    </html>
  );
}
