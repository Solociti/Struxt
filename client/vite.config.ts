import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { VitePWA } from "vite-plugin-pwa";
import svgLoader from "vite-svg-loader";

export default defineConfig({
  plugins: [
    react(),
    svgLoader(),
    viteStaticCopy({
      targets: [
        {
          src: resolve(process.cwd(), "../wasm-bins/*.wasm"),
          dest: "parsers",
        },
      ],
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      manifest: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        home: "index.html",
        dashboard: "dashboard/index.html",
        editor: "dashboard/editor/index.html",
      },
      output: {
        assetFileNames: "resource/[name]-[hash].[ext]",
        entryFileNames: "resource/[name]-[hash].js",
        chunkFileNames: "resource/[name]-[hash].js",
      },
    },
  },
  resolve: {
    alias: {
      "/src": resolve(process.cwd(), "src"),
      common: resolve(process.cwd(), "../common"),
      client: resolve(process.cwd(), "src"),
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
          // @ts-ignore
          "if-function",
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
      "/screenshots": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
    },
  },
});
