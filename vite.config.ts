import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  test: {
    env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "" },
    include: ["src/**/*.test.{ts,tsx}", "supabase/tests/*.test.mjs"],
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
