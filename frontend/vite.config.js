import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  server: { port: 5173, proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } } },
=======
  server: { port: 5173, proxy: { "/api": { target: "https://enggstack-1.onrender.com", changeOrigin: true } } },
>>>>>>> aa34717e4aab2e0d5daa253fdebdafcf824aa76c
});
