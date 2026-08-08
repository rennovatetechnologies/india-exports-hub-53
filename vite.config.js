import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/** Vite still injects @vite/client (and opens a WS) even with hmr:false — strip it. */
function disableViteWebSocket() {
  return {
    name: "disable-vite-websocket",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(
          /<script\b[^>]*\bsrc=["']\/@vite\/client["'][^>]*><\/script>\n?/gi,
          ""
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [
    react({ include: /\.(js|jsx|ts|tsx)$/ }),
    tailwindcss(),
    disableViteWebSocket(),
  ],
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  esbuild: { loader: "jsx", include: /src\/.*\.(js|jsx)$/, exclude: [] },
  optimizeDeps: {
    esbuildOptions: { loader: { ".js": "jsx" } },
  },
  server: {
    host: true,
    port: 5173,
    hmr: false,
    ws: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
});
