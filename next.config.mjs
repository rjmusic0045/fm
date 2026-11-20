/** @type {import('next').NextConfig} */
const nextConfig = {
  // Separate build folders let a Turbopack and a webpack dev server run side by
  // side without overwriting each other's output (e.g. NEXT_DIST_DIR=.next-turbo).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
    ],
  },
};

export default nextConfig;
