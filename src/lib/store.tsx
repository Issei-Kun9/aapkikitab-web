"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getBook } from "@/data/books";

export interface CartLine {
  slug: string;
  qty: number;
}

interface ShopState {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  removeFromCart: (slug: string) => void;
  toggleWish: (slug: string) => void;
  isWished: (slug: string) => boolean;
  cartCount: number;
  subtotal: number;
}

const ShopContext = createContext<ShopState | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(read<CartLine[]>("ak_cart", []));
    setWishlist(read<string[]>("ak_wishlist", []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("ak_cart", JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (ready) localStorage.setItem("ak_wishlist", JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const value = useMemo<ShopState>(() => {
    const cartCount = cart.reduce((n, l) => n + l.qty, 0);
    const subtotal = cart.reduce((n, l) => n + (getBook(l.slug)?.price ?? 0) * l.qty, 0);
    return {
      cart,
      wishlist,
      cartCount,
      subtotal,
      addToCart: (slug, qty = 1) =>
        setCart((c) => {
          const line = c.find((l) => l.slug === slug);
          if (line) return c.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l));
          return [...c, { slug, qty }];
        }),
      setQty: (slug, qty) =>
        setCart((c) => (qty <= 0 ? c.filter((l) => l.slug !== slug) : c.map((l) => (l.slug === slug ? { ...l, qty } : l)))),
      removeFromCart: (slug) => setCart((c) => c.filter((l) => l.slug !== slug)),
      toggleWish: (slug) => setWishlist((w) => (w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug])),
      isWished: (slug) => wishlist.includes(slug),
    };
  }, [cart, wishlist]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
