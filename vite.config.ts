import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";

export default defineConfig({
  plugins: [svgLoader()],
  build: {
    rollupOptions: {
      input: {
        editor: "./index.html",
      },
      output: {
        assetFileNames: "resource/[name]-[hash].[ext]",
        entryFileNames: "resource/[name]-[hash].js",
        chunkFileNames: "resource/[name]-[hash].js",
      },
    },
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
      "/assets": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
    },
  },
});
