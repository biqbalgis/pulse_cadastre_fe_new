import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Dev server proxies /api to pulse_cadastre_be_new (FastAPI, root_path="/api").
// Production is served by nginx, which proxies /api the same way.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = (env.VITE_API_PROXY_TARGET || "http://localhost:5199").replace(/\/+$/, "");

  return {
    base: "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    server: {
      port: parseInt(env.VITE_DEV_PORT || "5177", 10),
      strictPort: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
