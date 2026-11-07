import { createClient } from "@supabase/supabase-js";
const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = import.meta.env;
if (Boolean(url) !== Boolean(key))
  throw new Error("Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
export const supabase = url && key ? createClient(url, key) : null;
export function requireSupabase() {
  if (!supabase)
    throw new Error("The store is not connected yet. Please connect Supabase.");
  return supabase;
}
