import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      themePlugin(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            (await import("@replit/vite-plugin-cartographer")).cartographer(),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    define: {
      // Explicitly define environment variables for the build
      'import.meta.env.***REMOVED***': JSON.stringify(env.***REMOVED***),
      'import.meta.env.***REMOVED***': JSON.stringify(env.***REMOVED***),
      'import.meta.env.***REMOVED***': JSON.stringify(env.***REMOVED***),
      'import.meta.env.***REMOVED***': JSON.stringify(env.***REMOVED***),
      'import.meta.env.***REMOVED***': JSON.stringify(env.***REMOVED***),
      'import.meta.env.***REMOVED***': JSON.stringify(env.***REMOVED***),
    },
  };
});
