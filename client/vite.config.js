import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => {
  const plugins = [react(), tailwindcss()];

  // Only add PWA in production builds
  if (command === "build") {
    plugins.push(
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          // Keep this list in sync with files present in client/public
          "pwa-192x192.png",
          "pwa-512x512.png",
          "offline.html",
          "vite.svg",
        ],
        manifest: {
          name: "RentSmart - Rental Management",
          short_name: "RentSmart",
          description: "Rental management system for businesses",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api"),
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
          navigateFallback: "/offline.html",
          navigationPreload: true,
        },
        devOptions: {
          enabled: false,
        },
      })
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(fileURLToPath(new URL("./src", import.meta.url))),
      },
    },
    server: {
      host: true, // allow LAN access
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 5173,
      strictPort: true,
    },
    build: {
      sourcemap: true,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/setupTests.js",
          "**/*.test.js",
          "**/__mocks__/**",
        ],
      },
    },
  };
});
