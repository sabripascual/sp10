-- SP10 · programar los avisos cada 15 minutos (pg_cron + pg_net)
-- 1) Reemplazá TU_CRON_SECRET por el mismo valor que pusiste en Vercel (CRON_SECRET).
-- 2) Reemplazá TU_URL si tu dominio de producción no es sp10-flax.vercel.app.
-- 3) Corré todo en Supabase → SQL Editor. Después borrá la consulta del historial.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- El secreto queda guardado cifrado en Vault, no en el texto del cron
select vault.create_secret('TU_CRON_SECRET', 'sp10_cron_secret')
where not exists (select 1 from vault.secrets where name = 'sp10_cron_secret');

select cron.unschedule('sp10-notify') where exists (select 1 from cron.job where jobname = 'sp10-notify');

select cron.schedule(
  'sp10-notify',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://sp10-flax.vercel.app/api/cron/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sp10_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verificar: últimas ejecuciones
-- select * from cron.job_run_details order by start_time desc limit 5;
-- select status_code, content from net._http_response order by created desc limit 5;
