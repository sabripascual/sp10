import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/profile";
import {
  dayMark,
  fastWindow,
  fastStreak,
  getFastState,
  lastNDays,
  localDate,
  shiftDate,
  type DayMark,
  type FastDay,
  type FastState,
  type FastStatus,
  baseDurationMinutes,
} from "@/lib/fast";

export type FastData = {
  profile: Profile;
  now: Date;
  state: FastState;
  streak: number;
  calendar: { date: string; mark: DayMark; editable: boolean; startISO: string; endISO: string }[];
  /** Últimos ayunos terminados con sus horas (reales si se marcaron, si no según horario). */
  history: { date: string; startISO: string; endISO: string; hours: number; mark: DayMark; confirmed: boolean }[];
};

/**
 * Fecha desde la que se cuentan ayunos: el día en que se creó el perfil,
 * o antes si se cargaron ayunos anteriores a mano.
 */
export function sinceDate(profile: Profile, records?: Map<string, FastDay>) {
  const created = localDate(new Date(profile.created_at), profile.timezone);
  const earliest = records ? [...records.keys()].sort()[0] : undefined;
  return earliest && earliest < created ? earliest : created;
}

/** Cuántos días para atrás se pueden cargar o corregir. */
export const EDITABLE_DAYS = 60;

/** Cacheado por request: Hoy y el nivel semanal piden lo mismo. */
export const loadFastRecords = cache(async function loadFastRecords(profile: Profile, fromDate: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fast_days")
    .select("date, status, broken_at, extra_hours, event_id, started_at, ended_at")
    .gte("date", fromDate)
    .order("date");
  if (error) throw new Error(`No pude leer los ayunos: ${error.message}`);
  return new Map((data as FastDay[]).map((r) => [r.date, r]));
});

export async function getFastData(): Promise<FastData> {
  const profile = await getProfile();
  const now = new Date();
  const records = await loadFastRecords(profile, shiftDate(localDate(now, profile.timezone), -400));
  const since = sinceDate(profile, records);
  const cfg = profile;
  return {
    profile,
    now,
    state: getFastState(now, cfg, records),
    streak: fastStreak(now, cfg, records, since),
    calendar: lastNDays(now, profile.timezone, 30).map((date) => {
      const w = fastWindow(date, cfg, records.get(date) ?? null);
      return {
        date,
        mark: dayMark(date, now, cfg, records, since),
        // se puede tocar cualquier ayuno que ya terminó
        editable: w.end <= now && fastWindow(date, cfg, null).end <= now,
        startISO: w.start.toISOString(),
        endISO: (w.end.getTime() > w.start.getTime() ? w.end : w.plannedEnd).toISOString(),
      };
    }),
    history: lastNDays(now, profile.timezone, 14)
      .reverse()
      .map((date) => {
        const w = fastWindow(date, cfg, records.get(date) ?? null);
        return { date, w, mark: dayMark(date, now, cfg, records, since) };
      })
      .filter(({ w, mark }) => mark !== "none" && mark !== "pending" && w.end <= now)
      .slice(0, 10)
      .map(({ date, w, mark }) => ({
        date,
        startISO: w.start.toISOString(),
        endISO: w.end.toISOString(),
        hours: Math.round(((w.end.getTime() - w.start.getTime()) / 3_600_000) * 10) / 10,
        mark,
        confirmed: Boolean(w.record?.started_at || w.record?.ended_at || w.record?.broken_at),
      })),
  };
}

/** Serializa el estado para pasarlo a componentes de cliente. */
export type FastView = {
  phase: FastState["phase"];
  startISO: string; // ayuno en curso, o el último que terminó
  endISO: string;
  lastStatus: FastStatus | null; // cómo terminó el último (en ventana abierta)
  nextStartISO: string;
  extraHours: number;
  canExtend: boolean;
  canResume: boolean;
  baseHours: number;
  /** Ayuno que "Recién arranco" puede marcar como perdido (el anterior al que arranca). */
  restartPrevDate: string;
  timezone: string;
  nowISO: string;
};

export function toView({ state, now, profile }: FastData): FastView {
  const current = state.phase === "eating" ? state.previous : state.window;
  const next = state.phase === "eating" ? state.next : null;
  return {
    phase: state.phase,
    startISO: current.start.toISOString(),
    endISO: current.end.toISOString(),
    lastStatus: state.phase === "eating" ? (current.record?.status ?? "ok") : null,
    nextStartISO: (next ?? current).start.toISOString(),
    extraHours: current.record?.extra_hours ?? 0,
    canExtend:
      state.phase === "eating" ? state.canExtend : (current.record?.extra_hours ?? 0) < 8 || state.phase === "overtime",
    canResume: state.phase === "eating" && state.canResume,
    baseHours: baseDurationMinutes(profile) / 60,
    restartPrevDate: state.phase === "eating" ? state.previous.date : shiftDate(state.window.date, -1),
    timezone: profile.timezone,
    nowISO: now.toISOString(),
  };
}
