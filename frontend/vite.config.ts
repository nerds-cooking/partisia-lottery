import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      crypto: "crypto-browserify", // Polyfill for crypto module
      stream: "stream-browserify", // Polyfill for stream module
      buffer: "buffer", // Polyfill for Buffer
      assert: "assert", // Polyfill for assert
      process: "process", // Polyfill for process
      global: "globalThis", // Polyfill for global
      events: "events", // Polyfill for events
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis", // Define globalThis as global
    process: JSON.stringify({
      version: "v23.11.1", // Set process version
      env: { NODE_ENV: "production" }, // Add any environment variables you need
    }),
  },
  build: {
    minify: false,
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      plugins: [
        // @ts-expect-error this is fine..
        rollupNodePolyFill(),
      ],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
});
