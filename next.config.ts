import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Indikator pengembangan Next.js (tombol "N") dipindah agar tidak menutupi navigasi bawah.
  devIndicators: { position: "top-right" },
  // Izinkan HP di jaringan lokal membuka dev server (mis. http://192.168.1.3:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
