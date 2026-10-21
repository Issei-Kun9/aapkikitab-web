import { ShopProvider } from "@/lib/store";
import { Announcement, Header, BottomNav, Footer } from "@/components/chrome";
import { Analytics } from "@/components/Analytics";
import { MoreBooks } from "@/components/more-books";
import { ChatWidget } from "@/components/chat";

/* The shop's frame: header, footer, phone bottom bar and the team chat. (The admin panel has its own.) */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics />
      <ShopProvider>
        <Announcement />
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 lg:pb-10">
          {children}
          <MoreBooks />
        </main>
        <Footer />
        <BottomNav />
        <ChatWidget />
      </ShopProvider>
    </>
  );
}
