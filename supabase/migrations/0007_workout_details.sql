-- Ringo · detalle de entrenos (zonas de fierritos y kcal de carrera)
-- Pegar en Supabase → SQL Editor → Run. Se puede correr más de una vez.
--
-- details:
--   fierritos → {"zones": {"brazos": {"exercises": 3, "reps": 12, "rounds": 3}, "core": {...}, "piernas": {...}}}
--   carrera   → {"kcal": 280}
alter table public.workouts add column if not exists details jsonb not null default '{}';
