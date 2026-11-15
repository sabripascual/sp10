export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Solo el email de la dueña puede entrar. */
export function isAllowedEmail(email: string | null | undefined) {
  const allowed = (process.env.ALLOWED_EMAIL ?? "").trim().toLowerCase();
  return Boolean(allowed) && (email ?? "").trim().toLowerCase() === allowed;
}
