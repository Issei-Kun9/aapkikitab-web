import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages (no adapter needed).
  // Images are pre-sized at the URL level (Open Library + Unsplash w= params).
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
