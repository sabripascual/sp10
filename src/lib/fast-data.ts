import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/profile";
import {
  dayMark,
  fastStreak,
  getFastState,
  lastNDays,
  localDate,
  shiftDate,
  type DayMark,
  type FastDay,
  type FastState,
} from "@/lib/fast";

export type FastData = {
  profile: Profile;
  now: Date;
  state: FastState;
  streak: number;
  calendar: { date: string; mark: DayMark }[];
};

/** Fecha desde la que se cuentan ayunos: el día en que se creó el perfil. */
export function sinceDate(profile: Profile) {
  return localDate(new Date(profile.created_at), profile.timezone);
}

export async function loadFastRecords(profile: Profile, fromDate: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fast_days")
    .select("date, status, broken_at, extra_hours, event_id")
    .gte("date", fromDate)
    .order("date");
  if (error) throw new Error(`No pude leer los ayunos: ${error.message}`);
  return new Map((data as FastDay[]).map((r) => [r.date, r]));
}

export async function getFastData(): Promise<FastData> {
  const profile = await getProfile();
  const now = new Date();
  const since = sinceDate(profile);
  const records = await loadFastRecords(profile, shiftDate(since, -1));
  const cfg = profile;
  return {
    profile,
    now,
    state: getFastState(now, cfg, records),
    streak: fastStreak(now, cfg, records, since),
    calendar: lastNDays(now, profile.timezone, 30).map((date) => ({
      date,
      mark: dayMark(date, now, cfg, records, since),
    })),
  };
}

/** Serializa el estado para pasarlo a componentes de cliente. */
export type FastView = {
  phase: FastState["phase"];
  startISO: string;
  endISO: string;
  brokenAtISO: string | null;
  nextStartISO: string;
  extraHours: number;
  canExtend: boolean;
  timezone: string;
  nowISO: string;
};

export function toView({ state, now, profile }: FastData): FastView {
  const current = state.phase === "eating" ? state.previous : state.window;
  const next = state.phase === "fasting" ? null : state.next;
  return {
    phase: state.phase,
    startISO: current.start.toISOString(),
    endISO: current.end.toISOString(),
    brokenAtISO: current.record?.broken_at ?? null,
    nextStartISO: (next ?? current).start.toISOString(),
    extraHours: current.record?.extra_hours ?? 0,
    canExtend:
      state.phase === "fasting"
        ? (current.record?.extra_hours ?? 0) < 8
        : state.phase === "eating" && state.canExtend,
    timezone: profile.timezone,
    nowISO: now.toISOString(),
  };
}
