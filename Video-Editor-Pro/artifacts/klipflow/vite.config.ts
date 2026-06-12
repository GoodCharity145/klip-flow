import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Hardcode mock mode directly into the compiler engine
process.env.VITE_MOCK_MODE = "true";

// Safe fallback variables that won't throw hard errors on Vercel
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    // Only load heavy Replit feedback overlays if we are actively developing inside Replit
    ...(!isProduction && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: true,
    minify: "esbuild",
    rollupOptions: {
      maxParallelFileOps: 2,
    },
  },
  server: {
    port,
    strictPort: !isProduction, // Relax strictness on production hosting platforms
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});