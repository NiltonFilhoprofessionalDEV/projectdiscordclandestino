import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.ts";
import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "./config.ts";

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; error: { code: "UNAUTHENTICATED"; message: string } };

export type AuthClient = {
  auth: {
    getUser: (jwt: string) => Promise<{
      data: { user: User | null };
      error: { message: string } | null;
    }>;
  };
};

const UNAUTHENTICATED: Extract<AuthResult, { ok: false }> = {
  ok: false,
  error: { code: "UNAUTHENTICATED", message: "Sessão inválida ou expirada." },
};

let cached: SupabaseClient<Database> | undefined;

export function getSupabase(): SupabaseClient<Database> {
  if (cached) {
    return cached;
  }
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Supabase do servidor não configurado.");
  }
  cached = createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property) {
    const client = getSupabase();
    const value = Reflect.get(client, property, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

function parseAccessToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }
  const parts = authorizationHeader.split(" ");
  if (parts.length !== 2) {
    return null;
  }
  const [scheme, token] = parts;
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

export async function requireUser(
  authorizationHeader: string | undefined,
  client: AuthClient = getSupabase(),
): Promise<AuthResult> {
  const accessToken = parseAccessToken(authorizationHeader);
  if (!accessToken) {
    return UNAUTHENTICATED;
  }

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    return UNAUTHENTICATED;
  }

  return { ok: true, user: data.user };
}
