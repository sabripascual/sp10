import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile, type Profile } from "@/lib/profile";
import { localDate, shiftDate, type FastDay } from "@/lib/fast";
import { sinceDate } from "@/lib/fast-data";
import { isoDay, weekStart } from "@/lib/week";
import { missingText, profileGoals } from "@/lib/goals";
import { firstGradedWeek, levelFor, weekScore } from "@/lib/level";
import { weekGoals, weekSummaries } from "@/lib/progress";
import { avatarUrl } from "@/lib/avatar";
import type { ClubMember } from "@/lib/club";
import { withFallback } from "@/lib/db-fallback";



type Db = ReturnType<typeof createAdminClient>;

/**
 * Nivel de una usuaria en la semana que cerró, la anterior y la en curso (hoy y ayer).
 * Se usa en el Club y en el cron (avisos del Club). Solo devuelve puntos, niveles y %.
 */
export async function clubStanding(db: Db, p: Profile, now: Date) {
  const today = localDate(now, p.timezone);
  const current = weekStart(today);
  const from = shiftDate(current, -15);
  const [fasts, workouts, events] = await Promise.all([
    db.from("fast_days").select("date, status, broken_at, extra_hours, event_id, started_at, ended_at").eq("user_id", p.id).order("date"),
    db.from("workouts").select("id, date, type, minutes, status").eq("user_id", p.id).gte("date", from),
    withFallback(db.from("events").select("date, compensated_at, compensated_by").eq("user_id", p.id).gte("date", from), () =>
      db.from("events").select("date, compensated_at").eq("user_id", p.id).gte("date", from),
    ),
  ]);
  const records = new Map(((fasts.data ?? []) as FastDay[]).map((r) => [r.date, r]));
  const since = sinceDate(p, records);
  const input = { cfg: p, since, records, workouts: workouts.data ?? [], events: events.data ?? [], goals: (ws: string) => profileGoals(p, ws), weeks: 3 };
  const [prevW, closedW, liveW] = weekSummaries({ ...input, now });
  const graded = firstGradedWeek(since);
  const grade = (w: typeof closedW) => {
    const score = weekScore(w);
    return { score, level: levelFor(score).key, pct: weekGoals(w).pct };
  };
  // Ayer, dentro de la misma semana (el lunes no hay "ayer" en esta semana)
  let liveYesterday: ClubMember["liveYesterday"] = null;
  if (isoDay(today) !== 1) {
    const y = weekSummaries({ ...input, now: new Date(now.getTime() - 86_400_000), weeks: 1 })[0];
    const s = weekScore(y);
    liveYesterday = { score: s, level: levelFor(s).key };
  }
  return {
    closed: closedW.weekStart >= graded ? grade(closedW) : null,
    prev: prevW.weekStart >= graded ? (({ score, level }) => ({ score, level }))(grade(prevW)) : null,
    live: grade(liveW),
    liveYesterday,
    missing: missingText(weekGoals(liveW).items),
  };
}

// ── Clubes ────────────────────────────────────────────────────────────────

export const CLUB_MAX_MEMBERS = 30;

export type ClubInfo = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  role: "owner" | "member";
  myName: string;
  memberCount: number;
};

type MemberRow = { club_id: string; user_id: string; role: "owner" | "member"; display_name: string };

/** Clubes de una usuaria (el más viejo primero). */
export async function myClubs(db: Db, userId: string): Promise<ClubInfo[]> {
  const { data: mine } = await db.from("club_members").select("club_id, role, display_name, joined_at").eq("user_id", userId).order("joined_at");
  const ids = (mine ?? []).map((m) => m.club_id as string);
  if (!ids.length) return [];
  const [{ data: clubs }, { data: all }] = await Promise.all([
    db.from("clubs").select("id, name, owner_id, invite_code").in("id", ids),
    db.from("club_members").select("club_id").in("club_id", ids),
  ]);
  const count = (id: string) => (all ?? []).filter((m) => m.club_id === id).length;
  return (mine ?? [])
    .map((m) => {
      const c = (clubs ?? []).find((x) => x.id === m.club_id);
      if (!c) return null;
      return {
        id: c.id as string,
        name: c.name as string,
        ownerId: c.owner_id as string,
        inviteCode: c.invite_code as string,
        role: m.role as ClubInfo["role"],
        myName: m.display_name as string,
        memberCount: count(c.id as string),
      };
    })
    .filter(Boolean) as ClubInfo[];
}

/** Miembros de un club con sus perfiles (sin cuentas pausadas ni pendientes). */
export async function clubRoster(db: Db, clubId: string) {
  const { data: rows } = await db.from("club_members").select("club_id, user_id, role, display_name").eq("club_id", clubId).order("joined_at");
  const list = (rows ?? []) as MemberRow[];
  if (!list.length) return [];
  const { data: profiles } = await db.from("profiles").select("*").in("id", list.map((r) => r.user_id));
  return list
    .map((r) => ({ row: r, profile: (profiles ?? []).find((p) => p.id === r.user_id) as Profile | undefined }))
    .filter((x): x is { row: MemberRow; profile: Profile } => Boolean(x.profile && x.profile.role !== "disabled" && x.profile.role !== "pending"));
}

/** Arma los miembros de un club con su nivel (calcula cada perfil una sola vez si se pasa `cache`). */
export async function standingsFor(
  db: Db,
  roster: { row: MemberRow; profile: Profile }[],
  now: Date,
  meId: string | null,
  cache = new Map<string, Awaited<ReturnType<typeof clubStanding>>>(),
) {
  return Promise.all(
    roster.map(async ({ row, profile }) => {
      let s = cache.get(profile.id);
      if (!s) {
        s = await clubStanding(db, profile, now);
        cache.set(profile.id, s);
      }
      const m: ClubMember & { missing: string; role: MemberRow["role"] } = {
        id: profile.id,
        name: row.display_name,
        avatar: avatarUrl(profile.avatar_path),
        isMe: profile.id === meId,
        closed: s.closed,
        prev: s.prev,
        live: s.live,
        liveYesterday: s.liveYesterday,
        missing: s.missing,
        role: row.role,
      };
      return m;
    }),
  );
}

/** Todos los clubes con sus miembros y niveles (para el cron y el Panel). Cada perfil se calcula una vez. */
export async function allClubStandings(db: Db, now: Date) {
  const [{ data: clubs }, { data: rows }] = await Promise.all([
    db.from("clubs").select("id, name, owner_id, created_at"),
    db.from("club_members").select("club_id, user_id, role, display_name"),
  ]);
  const ids = [...new Set((rows ?? []).map((r) => r.user_id as string))];
  const { data: profiles } = ids.length ? await db.from("profiles").select("*").in("id", ids) : { data: [] };
  const cache = new Map<string, Awaited<ReturnType<typeof clubStanding>>>();
  return Promise.all(
    (clubs ?? []).map(async (c) => {
      const roster = ((rows ?? []) as MemberRow[])
        .filter((r) => r.club_id === c.id)
        .map((row) => ({ row, profile: (profiles ?? []).find((p) => p.id === row.user_id) as Profile | undefined }))
        .filter((x): x is { row: MemberRow; profile: Profile } => Boolean(x.profile && x.profile.role !== "disabled" && x.profile.role !== "pending"));
      return {
        id: c.id as string,
        name: c.name as string,
        ownerId: c.owner_id as string,
        createdAt: c.created_at as string,
        members: await standingsFor(db, roster, now, null, cache),
      };
    }),
  );
}

export type ClubData = {
  me: Profile;
  clubs: ClubInfo[];
  /** El club que se está mirando (null si no está en ninguno). */
  club: ClubInfo | null;
  closedWeek: string;
  isMonday: boolean;
  daysLeft: number;
  members: (ClubMember & { role: "owner" | "member" })[];
  myMissing: string;
};

/**
 * Ringo Club: el club elegido (o el primero) con sus miembros. Se calcula con service role,
 * SOLO de las miembros, y devuelve únicamente nombre en el club, foto, niveles, puntos y %.
 */
export async function getClubData(clubId?: string): Promise<ClubData> {
  const me = await getProfile();
  const now = new Date();
  const today = localDate(now, me.timezone);
  const closedWeek = shiftDate(weekStart(today), -7);
  const db = createAdminClient();
  const clubs = await myClubs(db, me.id);
  const club = clubs.find((c) => c.id === clubId) ?? clubs[0] ?? null;
  const base = { me, clubs, club, closedWeek, isMonday: isoDay(today) === 1, daysLeft: 8 - isoDay(today) };
  if (!club) return { ...base, members: [], myMissing: "" };

  const members = await standingsFor(db, await clubRoster(db, club.id), now, me.id);
  const myMissing = members.find((m) => m.isMe)?.missing ?? "";
  return {
    ...base,
    members: members.map((m) => {
      const { missing, ...rest } = m;
      void missing; // lo que le falta a cada una no se manda: solo el tuyo (myMissing)
      return rest;
    }),
    myMissing,
  };
}

/** Datos de una invitación (para la pantalla de "te invitan a…"). */
export async function inviteInfo(code: string) {
  const db = createAdminClient();
  const { data: club } = await db.from("clubs").select("id, name, owner_id").eq("invite_code", code).maybeSingle();
  if (!club) return null;
  const [{ data: rows }, { data: owner }] = await Promise.all([
    db.from("club_members").select("user_id, display_name, role").eq("club_id", club.id),
    db.from("profiles").select("display_name").eq("id", club.owner_id).maybeSingle(),
  ]);
  const ownerRow = (rows ?? []).find((r) => r.role === "owner");
  return {
    id: club.id as string,
    name: club.name as string,
    ownerName: (ownerRow?.display_name as string) ?? (owner?.display_name as string) ?? "Una amiga",
    memberCount: (rows ?? []).length,
    memberIds: (rows ?? []).map((r) => r.user_id as string),
  };
}
