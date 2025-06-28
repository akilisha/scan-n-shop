import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "@capacitor/core",
      "@capacitor/camera",
      "@capacitor/barcode-scanner",
      "@capacitor/geolocation",
      "@capacitor/haptics",
      "@capacitor/preferences",
      "@capacitor/push-notifications",
      "@capacitor/network",
      "@capacitor/device",
    ],
  },
  define: {
    global: "globalThis",
  },
}));
