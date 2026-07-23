import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Backlogzy",
        short_name: "Backlogzy",
        description: "A productive backlog manager",
        theme_color: "#ffffff",
        background_color: "#fafafa",
        display: "standalone",
        start_url: "/board",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        // SPA fallback for client-side routes; never intercept API/OAuth calls.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api-docs/, /^\/auth\//, /^\/v1\//],
      },
    }),
  ],
  resolve: {
    // Vite resolves a leading-slash alias from the project root.
    alias: { "@": "/src" },
  },
  server: {
    port: 5173,
    proxy: {
      "/v1": { target: "http://localhost:3000", changeOrigin: true },
      // OAuth start is served by the API; NOT /auth/callback (that's a SPA route).
      "/auth/google_oauth2": { target: "http://localhost:3000", changeOrigin: true },
      "/auth/github": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
