import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
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
