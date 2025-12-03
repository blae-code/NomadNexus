import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const pwaConfig = VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico"],
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
  },
  manifest: {
    name: "Nomad Ops",
    short_name: "Nomad Ops",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    theme_color: "#000000",
    background_color: "#000000",
    icons: [
      {
        src: "favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon",
      },
    ],
  },
});

export default defineConfig({
  plugins: [
    react(),
    pwaConfig,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
