import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const frontendPort = Number(process.env.FRONTEND_PORT || 5173);
const backendPort = Number(process.env.BACKEND_PORT || 5001);

export default defineConfig({
  plugins: [
    react({ include: /\.(js|jsx|ts|tsx)$/ }),
    tailwindcss(),
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
    port: frontendPort,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      clientPort: frontendPort,
    },
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
