import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

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
  server: { host: true, port: 5173 },
});
