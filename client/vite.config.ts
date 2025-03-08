import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";

export default defineConfig({
  plugins: [react(), svgLoader()],
  build: {
    rollupOptions: {
      input: {
        home: "index.html",
        dashboard: "dashboard/index.html",
        editor: "editor/index.html",
      },
      output: {
        assetFileNames: "resource/[name]-[hash].[ext]",
        entryFileNames: "resource/[name]-[hash].js",
        chunkFileNames: "resource/[name]-[hash].js",
      },
    },
  },
  resolve: {
    alias: { "/src": resolve(process.cwd(), "src") },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          "mixed-decls",
          "color-functions",
          "global-builtin",
          "import",
        ],
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
      "/assets": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
    },
  },
});
