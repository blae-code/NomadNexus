import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          "livekit-vendor": ["livekit-client"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "ui-icons": ["lucide-react"],
        }
      }
    }
  }
})