import "server-only";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/profile";
import { localDate, shiftDate } from "@/lib/fast";

/** Corta el paso si la sesión no es admin (404, ni siquiera se entera de que existe). */
export async function requireAdmin() {
  const profile = await getProfile();
  if (profile.role !== "admin") notFound();
  return profile;
}

export type AccountRow = {
  id: string;
  email: string;
  role: "admin" | "user" | "disabled";
  createdAt: string;
  lastSignIn: string | null;
  lastSeen: string | null; // último ingreso a la app (o el último login si todavía no hay)
  lastActivity: string | null; // último registro de cualquier tipo
  fasts30: number; // ayunos marcados a mano en 30 días
  workouts30: number;
  checks: number;
  events: number;
  push: boolean;
};

export type Applicant = { id: string; email: string; name: string; whatsapp: string | null; createdAt: string };
export type PasswordRequest = { id: string; email: string; whatsapp: string; createdAt: string; userId: string | null; name: string | null };

export type AdminStats = {
  applicants: Applicant[];
  passwordRequests: PasswordRequest[];
  total: number;
  active7: number;
  new7: number;
  withPush: number;
  workoutsByType: { type: string; count: number }[];
  accounts: AccountRow[];
};

/**
 * Métricas de USO (no de salud): cuántas cuentas, quién usa y cuánto.
 * Nunca devuelve pesos, medidas ni fotos.
 */
export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const db = createAdminClient();
  const today = localDate(new Date(), "America/Argentina/Tucuman");
  const since30 = shiftDate(today, -30);
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [usersRes, profiles, fasts, workouts, checks, events, subs] = await Promise.all([
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.from("profiles").select("*"),
    db.from("fast_days").select("user_id, updated_at").gte("date", since30),
    db.from("workouts").select("user_id, type, created_at, status").gte("date", since30),
    db.from("body_checks").select("user_id, created_at"),
    db.from("events").select("user_id, created_at"),
    db.from("push_subscriptions").select("user_id"),
  ]);
  const { data: reqData } = await db
    .from("password_requests")
    .select("id, email, whatsapp, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false }); // sin la migración 0020: null, no rompe
  if (usersRes.error) throw new Error(usersRes.error.message);

  const roleOf = new Map((profiles.data ?? []).map((p) => [p.id as string, p.role as AccountRow["role"]]));
  const latest = new Map<string, string>();
  const bump = (uid: string, at: string | null) => {
    if (at && (!latest.get(uid) || at > latest.get(uid)!)) latest.set(uid, at);
  };
  const count = (rows: { user_id: string }[] | null) => {
    const m = new Map<string, number>();
    (rows ?? []).forEach((r) => m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1));
    return m;
  };

  (fasts.data ?? []).forEach((r) => bump(r.user_id, r.updated_at));
  (workouts.data ?? []).forEach((r) => bump(r.user_id, r.created_at));
  (checks.data ?? []).forEach((r) => bump(r.user_id, r.created_at));
  (events.data ?? []).forEach((r) => bump(r.user_id, r.created_at));

  const done = (workouts.data ?? []).filter((w) => w.status === "done");
  const fastsN = count(fasts.data);
  const workoutsN = count(done);
  const checksN = count(checks.data);
  const eventsN = count(events.data);
  const pushUsers = new Set((subs.data ?? []).map((s) => s.user_id as string));

  const profileOf = new Map((profiles.data ?? []).map((p) => [p.id as string, p as { display_name?: string | null; whatsapp?: string | null; last_seen_at?: string | null }]));
  const users = usersRes.data.users;
  const byEmail = new Map(users.map((u) => [(u.email ?? "").toLowerCase(), u.id]));
  const applicants: Applicant[] = users
    .filter((u) => roleOf.get(u.id) === ("pending" as AccountRow["role"]))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name: profileOf.get(u.id)?.display_name ?? u.email ?? "",
      whatsapp: profileOf.get(u.id)?.whatsapp ?? null,
      createdAt: u.created_at,
    }));
  const passwordRequests: PasswordRequest[] = (reqData ?? []).map((r) => {
    const userId = byEmail.get(String(r.email)) ?? null;
    return {
      id: r.id as string,
      email: r.email as string,
      whatsapp: r.whatsapp as string,
      createdAt: r.created_at as string,
      userId,
      name: userId ? (profileOf.get(userId)?.display_name ?? null) : null,
    };
  });

  const accounts: AccountRow[] = users
    .filter((u) => roleOf.get(u.id) !== ("pending" as AccountRow["role"]))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(sin email)",
      role: roleOf.get(u.id) ?? "user",
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      lastSeen: profileOf.get(u.id)?.last_seen_at ?? u.last_sign_in_at ?? null,
      lastActivity: latest.get(u.id) ?? null,
      fasts30: fastsN.get(u.id) ?? 0,
      workouts30: workoutsN.get(u.id) ?? 0,
      checks: checksN.get(u.id) ?? 0,
      events: eventsN.get(u.id) ?? 0,
      push: pushUsers.has(u.id),
    }))
    .sort((a, b) => (b.lastActivity ?? b.createdAt).localeCompare(a.lastActivity ?? a.createdAt));

  const byType = new Map<string, number>();
  done.forEach((w) => byType.set(w.type, (byType.get(w.type) ?? 0) + 1));

  return {
    applicants,
    passwordRequests,
    total: accounts.length,
    active7: accounts.filter((a) => (a.lastActivity ?? "") >= since7 || (a.lastSignIn ?? "") >= since7).length,
    new7: accounts.filter((a) => a.createdAt >= since7).length,
    withPush: accounts.filter((a) => a.push).length,
    workoutsByType: [...byType.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    accounts,
  };
}
