import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const actionBase = process.env.GITHUB_ACTIONS === "true" && repoName ? `/${repoName}/` : "/";
  const base = process.env.VITE_BASE_PATH || actionBase;

  return {
    base,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        includeAssets: ["favicon.ico", "robots.txt", "icons/icon-192.png", "icons/icon-512.png"],
        manifest: {
          name: "Knee Rehab Coach",
          short_name: "Rehab Coach",
          start_url: `${base}?source=pwa`,
          scope: base,
          display: "standalone",
          background_color: "#0B1020",
          theme_color: "#0B1020",
          description:
            "A calm, cinematic guided knee rehab routine with timers, reps, and pause/resume.",
          orientation: "portrait",
          categories: ["health", "fitness", "lifestyle"],
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            {
              src: "icons/maskable-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: `${base}index.html`,
          runtimeCaching: [
            {
              urlPattern: ({ request }) =>
                request.mode === "navigate" ||
                ["style", "script", "worker"].includes(request.destination),
              handler: "CacheFirst",
              options: {
                cacheName: "app-shell-cache",
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              urlPattern: ({ request }) =>
                ["image", "font"].includes(request.destination) ||
                request.destination === "" ||
                request.destination === "document",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "dynamic-cache",
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
              },
            },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
