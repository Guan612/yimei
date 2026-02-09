import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "next/link": path.resolve(__dirname, "src/compat/next-link.tsx"),
      "next/navigation": path.resolve(
        __dirname,
        "src/compat/next-navigation.ts",
      ),
      "next/font/local": path.resolve(
        __dirname,
        "src/compat/next-font-local.ts",
      ),
    },
  },
});
