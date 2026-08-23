import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : [];

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: true,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      chunkSizeWarningLimit: 550,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            supabase: ["@supabase/supabase-js"],
            map: ["leaflet"],
            ui: ["lucide-react", "motion"],
            forms: ["react-hook-form", "@hookform/resolvers", "zod"],
            utils: ["html-to-image", "supercluster"],
          },
        },
      },
    },
  };
});
