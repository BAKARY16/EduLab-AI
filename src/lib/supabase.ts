import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configuration manquante : ${name}`);
  return value;
}

export function isSupabaseAuthEnabled(): boolean {
  return process.env.AUTH_PROVIDER === "supabase";
}

/** Client serveur privilégié. Ne jamais importer ce module dans un composant client. */
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Client d'authentification sans persistance : la session applicative reste HttpOnly. */
export function getSupabaseAuth(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
