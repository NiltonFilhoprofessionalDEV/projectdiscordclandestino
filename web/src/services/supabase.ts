import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../shared/database.types.ts";

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

export const supabaseConfigError =
  !url || !key || key.includes("placeholder")
    ? "Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em web/.env (projeto Cloud)."
    : null;

function createSupabaseClient(): SupabaseClient<Database> {
  if (!url || !key) {
    // Client dummy só para não quebrar o bundle; Auth/API falham de forma controlada.
    return createClient<Database>("http://127.0.0.1:54321", "public-anon-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return createClient<Database>(url, key, {
    auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true },
  });
}

export const supabase = createSupabaseClient();
