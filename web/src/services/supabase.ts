import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../shared/database.types.ts";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  throw new Error("Supabase público não configurado.");
}

export const supabase = createClient<Database>(url, key, {
  auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true },
});
