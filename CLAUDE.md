# Ringo (ex SP10) — Documento del MVP

> 15 nov 2026 · Sabri Pascual. Este archivo es la fuente de verdad del producto. Claude Code lo lee al arrancar cada sesión.

## Convenciones del repo (para Claude Code)

- Idioma de la UI: español rioplatense (voseo), tono amigable, humor argentino, **nunca culpa**.
- Stack: Next.js 15 (App Router) + TypeScript + Tailwind v4 + componentes estilo shadcn/ui (en `src/components/ui`, escritos a mano porque el registro de shadcn no es accesible desde el entorno cloud).
- Zona horaria: `America/Argentina/Tucuman` (UTC-3). Todas las fechas con `date-fns` + `date-fns-tz`.
- La semana va de **lunes a domingo**.
- Tema BRAVE: tokens en `src/app/globals.css`. **Botonera inferior y botones de acción principales en amarillo** (`variant="primary"`); el resto en negro y grises. Fuente **Nunito**. Footer con firma BRAVE en todas las pantallas.
- Mobile first, modo oscuro siempre.
- Cada etapa termina con `npm run lint` y `npm run build` en verde, commit y deploy en Vercel.
- **Flujo de entrega**: cada etapa o corrección se sube directo a `main` (además de la rama de trabajo). La dueña la prueba en producción en Vercel y manda correcciones.
- Secretos solo en variables de entorno (Vercel / `.env.local`), nunca en el repo.

### Estado de las etapas

- [x] Etapa 0, base
- [x] Etapa 1, login y perfil
- [x] Etapa 2, ayuno y Hoy (+ botones Empezar/Terminar y calendario editable)
- [x] Etapa 3, entrenos y eventos
- [x] Etapa 4, cuerpo
- [x] Etapa 5, PWA y avisos
- [x] Etapa 6, progreso

---

## Visión y objetivo

SP10 es una PWA personal de hábitos que sostiene tres cosas: el ayuno 16:8, la fuerza 3 veces por semana y la evolución del cuerpo. No es un tracker de rendimiento: es un coach de bolsillo, motivador y con humor argentino.

Objetivos de la usuaria: bajar de peso, construir un cuerpo atlético y sostener un hábito deportivo con fuerza para ganar potencia y destreza para competir.

### Principios de producto

- **Cero fricción**: todo se registra con uno o dos toques. Lo que es rutina (el ayuno, el fútbol fijo) se asume cumplido salvo que se marque lo contrario.
- **Sin culpa**: no se anota qué se comió. Un evento social se compensa y queda la marca de compensado.
- **Progreso visible**: rachas, gráficos y resumen semanal son el motor de la motivación.
- **Cuidado con el peso**: pesaje quincenal, con opción de ocultar el número y ver solo la tendencia. Medidas y fotos tienen tanto protagonismo como la balanza.

**Métrica de éxito del MVP**: usarla todos los días durante 4 semanas seguidas, con al menos 3 sesiones de fuerza por semana registradas.

## Usuaria y rutina

La dueña (rol admin) y sus amigas (rol user), cada una con su propia cuenta y sus datos. Usan la app instalada en el iPhone. Su rutina define los valores por defecto.

### Día típico

| Momento | Hora | Qué pasa |
|---|---|---|
| Despertar | 9:00 | — |
| Primera comida (fin del ayuno) | 11:00 | Desayuno |
| Última comida (inicio del ayuno) | 19:00 | Se cierra la ventana de alimentación |

Ayuno 16:8 fijo de 19:00 a 11:00. Hoy no usa apps y controla mirando el reloj.

### Semana deportiva actual

| Día | Actividad habitual |
|---|---|
| Lunes | Academia de fútbol, 1 h |
| Martes | Entrenamiento de fútbol con el equipo |
| Miércoles | Nada o pádel |
| Jueves | Partido amistoso de fútbol (5 o 7), 50 min |
| Viernes | Libre |
| Sábado | Partido de fútbol |
| Domingo | Libre |

Meta nueva: fuerza en el gym 3 veces por semana, sin día fijo. Correr sin plan: le importa el tiempo corrido (hoy 30 min a ritmo limpio) y subir de a poco.

**Deslices**: vienen de eventos sociales (cumples, salidas) que terminan en cena o tragos. Suele saberlos con anticipación. No quiere anotar qué comió: quiere compensar al día siguiente con ayuno o entrenamiento y tener una marca de compensado.

**Cuerpo**: pesarse le genera angustia; hoy lo hace cada mes o más, e ideal sería cada 2 semanas. Tiene balanza. Le importan sobre todo piernas, cintura y brazos. Quiere fotos de progreso.

**Motivación**: rachas, gráficos de evolución y resúmenes semanales. Notificaciones de toda la rutina, en tono amigable y argentino.

**Fuera del MVP**: el Apple Watch casi no se usa para registrar; queda para una etapa posterior.

## Funcionalidades del MVP

Siete módulos. Cada uno lista lo que tiene que pasar para darlo por terminado.

### F1. Login con sesión persistente
- Login con email y contraseña de Supabase Auth; la sesión se renueva sola y no vuelve a pedir login en la PWA instalada.
- Solo el email de la dueña puede entrar (allowlist en una variable de entorno); cualquier otro ve "Acceso restringido".
- Perfil con rol admin.

### F2. Ayuno automático 16:8
- Configuración: protocolo a elección (12:12, 14:10, **16:8 por defecto**, 18:6, 20:4, 23:1 o personalizado) y hora de última comida (19:00); la primera comida se calcula. Mismo esquema todos los días.
- Cada día se asume cumplido. La usuaria solo interviene si lo rompe o lo extiende.
- Pantalla con contador en vivo, barra de progreso y hora de fin.
- Acciones: "Lo rompí" (registra la hora) y "Extender" (+1 h o +2 h).
- Racha de días cumplidos. Un día roto por un evento compensado no corta la racha.

### F3. Entrenamientos con un toque
- Tipos: Fútbol, Fuerza, Correr, Pádel, Otro.
- Plantilla de semana: lunes, martes, jueves y sábado aparecen como fútbol sugerido; un toque confirma y otro marca "no fui".
- Correr guarda minutos y sensación (Difícil / Bien / Excelente). Fuerza guarda duración y una nota opcional.
- Meta semanal visible: fuerza 3/3 con anillo de progreso. La semana va de lunes a domingo.

### F4. Eventos y compensación
- Crear un evento futuro o de hoy: nombre ("Cumple de Juli"), fecha y tipo (cena, tragos o ambos).
- Elegir compensación: +2 h de ayuno al día siguiente (primera comida a las 13:00), un entreno extra (fuerza o 30 min de correr), o las dos.
- El día previo se sugiere "preparar" (por ejemplo, fuerza ese día).
- Al día siguiente aparece la tarea; al tildarla queda la marca de compensado.
- No se registra qué se comió ni las calorías.

### F5. Cuerpo: peso, medidas y fotos
- Control quincenal con recordatorio. Se puede cargar en cualquier momento.
- Peso en kg con modo "número oculto": en ese modo se muestra solo la tendencia (bajando, estable o subiendo) y el número aparece al mantener presionado.
- Medidas en cm: cintura, cadera, pecho, brazo y pierna (muslo); todas opcionales.
- Fotos de frente, perfil y espalda, guardadas en Storage privado. Comparador antes/ahora con slider.

### F6. Progreso y resumen
- Rachas: ayuno, semanas con fuerza 3/3 y eventos compensados.
- Gráficos: medidas en el tiempo, tendencia de peso (promedio de controles) y minutos corridos por semana.
- Resumen semanal el domingo, por ejemplo: "3/3 fuerza, 7/7 ayuno, 1 evento compensado, 75 min corridos".

### F7. Notificaciones
- Web Push en la PWA instalada (iOS 16.4 o superior).
- Disparadores y frases en la sección de Notificaciones; cada tipo se puede activar o desactivar en Ajustes.
- Apodo aleatorio en cada mensaje.

## Pantallas y flujos

Cinco pestañas en una barra inferior, más Ajustes desde el avatar. Mobile first, con modo oscuro por defecto.

| Pestaña | Qué muestra | Acciones principales |
|---|---|---|
| Hoy | Saludo con apodo, estado del ayuno, qué toca hoy (fútbol sugerido, fuerza pendiente, compensación), rachas | Confirmar actividad, tildar compensación |
| Ayuno | Contador grande, progreso, hora de fin, racha, historial de 30 días en calendario | Lo rompí, Extender +1/+2 h |
| Entrenos | Semana lunes a domingo con chips por día, anillo de fuerza 3/3, minutos corridos | Registrar con un toque (bottom sheet) |
| Cuerpo | Último control, próximo control, tendencia, galería de fotos, comparador | Nuevo control (peso, medidas, fotos) |
| Progreso | Rachas, gráficos de medidas y peso, minutos corridos, resúmenes semanales | Ver resumen de semanas anteriores |
| Ajustes | Horario de ayuno, plantilla semanal, meta de fuerza, notificaciones, número oculto | Editar y activar o desactivar avisos |

### Flujo de evento y compensación
1. Desde Hoy o Entrenos: "Tengo un evento", con nombre, fecha y tipo.
2. La app propone compensación: +2 h de ayuno, entreno extra o ambas. Elige una.
3. El día previo: aviso "Mañana tenés el cumple, hoy metéle fuerza" (opcional).
4. El día del evento: el ayuno de esa noche queda marcado como "evento" y no corta la racha.
5. El día siguiente: la tarjeta de compensación aparece primera en Hoy.
6. Al tildarla: marca de compensado, animación y suma a la racha de compensados.
7. Si no se tilda en 48 h, queda como "pendiente", sin castigo, y se refleja en el resumen.

### Flujo de control quincenal
1. Notificación el día que toca.
2. Paso 1, peso (con número oculto si está activo). Paso 2, medidas. Paso 3, fotos. Todos se pueden saltear.
3. Cierre con comparación contra el control anterior, empezando por las medidas.

## Notificaciones

Nueve avisos cubren la rutina. Cada mensaje elige al azar un apodo de la lista y una frase del banco, sin repetir la última usada. Todas las horas son de Argentina (UTC-3).

Apodos: crack, reina, bebita, diosa, amorrrr. Se guardan en Ajustes y se pueden editar.

| Aviso | Cuándo | Ejemplo |
|---|---|---|
| Cierre de ventana | 18:30 todos los días | "{apodo}, metéle a la última comida que en media hora se te cierra la ventana" |
| Ayuno iniciado | 19:00 | "Arrancó el ayuno, {apodo}. Nos vemos a las 11 con todo" |
| Ayuno cumplido | 11:00 (o 13:00 si hay compensación) | "¡16 horas, {apodo}! Ya podés desayunar como la campeona que sos" |
| Fuerza pendiente | Jueves 10:00 si va menos de 2/3, domingo 10:00 si va menos de 3/3 | "{apodo}, vas 1 de 3 en fuerza y ya es jueves. Hora de meterle fierro" |
| Evento mañana | Día previo, 10:00 | "Mañana hay cumple, {apodo}. ¿Cómo lo compensamos?" |
| Compensación de hoy | Día siguiente, 10:00 | "Ayer fue fiesta, hoy toca devolverle al cuerpo. Vos podés, {apodo}" |
| Confirmar fútbol | Lunes, martes, jueves y sábado, 22:00 | "{apodo}, ¿hubo fútbol hoy? Tocame y lo anoto" |
| Control quincenal | Cada 14 días, 9:30 | "Toca control, {apodo}. Es solo un dato, no un juicio" |
| Resumen semanal | Domingo 20:00 | "Semana cerrada, {apodo}: 3/3 fuerza, 7/7 ayuno. Sos una máquina" |

### Banco de frases inicial
- "Crack, hora de meterle fierro"
- "Reina, metéle a la última comida que se te acaba la ventana"
- "Diosa, la racha no se cuida sola"
- "Bebita, 30 minutitos de trote y sos otra"
- "Amorrrr, el gym te extraña. No lo hagas sufrir"
- "Crack, ni el Dibu ataja tanta constancia"
- "Reina, hoy no se negocia: fuerza y a otra cosa"

**Reglas de tono**: nunca culpa ni vergüenza; humor y empuje. Ningún aviso menciona el peso como número. Silencio nocturno de 23:00 a 8:30.

## Modelo de datos (Supabase)

Ocho tablas en Postgres, todas con `user_id` y RLS que limita cada fila a su dueña. Las fotos van a un bucket privado de Storage.

| Tabla | Para qué | Campos clave |
|---|---|---|
| profiles | Usuaria y preferencias | id (= auth.users.id), role, nicknames text[], fast_start time, fast_end time, strength_goal int, hide_weight bool, timezone, week_template jsonb |
| fast_days | Un registro por día de ayuno | date, status (ok, broken, extended, event), broken_at, extra_hours, event_id |
| workouts | Entrenamientos | date, type (futbol, fuerza, correr, padel, otro), minutes, feeling, note, source (manual, template) |
| events | Eventos sociales | name, date, kind (cena, tragos, ambos), compensation (fast, workout, both), compensated_at, status |
| body_checks | Control quincenal | date, weight_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, note |
| body_photos | Fotos de progreso | check_id, angle (front, side, back), storage_path |
| push_subscriptions | Suscripciones Web Push | endpoint, p256dh, auth, user_agent |
| notification_log | Avisos enviados, para no repetir | kind, sent_at, phrase_id |

RLS (igual en todas las tablas):

```sql
alter table workouts enable row level security;
create policy "solo la dueña" on workouts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Storage: bucket `body-photos` privado, con la ruta `{user_id}/{check_id}/{angle}.jpg`. Se sirve con URLs firmadas de corta duración.

Vistas útiles: `v_week_summary` (fuerza, ayunos, minutos corridos y eventos por semana ISO) y `v_streaks` (rachas actuales y máximas).

## Stack y arquitectura

Next.js en Vercel para la app, y Supabase para datos, login, fotos y el reloj que dispara los avisos.

Cada 15 minutos Supabase llama al endpoint de avisos en Vercel. Ese endpoint decide qué notificación toca y la envía por Apple Web Push al iPhone.

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Server actions simplifican el backend |
| Estilos | Tailwind CSS + shadcn/ui | Componentes accesibles, fáciles de llevar a la marca BRAVE |
| Gráficos | Recharts | Medidas, peso y minutos corridos |
| Auth | Supabase Auth (email + contraseña) + @supabase/ssr | Cookies con refresh automático: la sesión no se cae |
| Datos | Supabase Postgres + RLS | Una usuaria, filas protegidas |
| Fotos | Supabase Storage (privado) | URLs firmadas |
| PWA | manifest.webmanifest + service worker | Instalable, ícono propio, push |
| Push | web-push con claves VAPID | Funciona en iOS 16.4 o superior con la app agregada a Inicio |
| Programación | Supabase pg_cron + pg_net | El cron de Vercel en el plan gratis corre como máximo una vez por día |
| Fechas | date-fns + date-fns-tz | Todo en America/Argentina/Tucuman |

Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo en el cron), `ALLOWED_EMAIL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.

## Branding BRAVE aplicado

Fondo oscuro, grises, Open Sans y el amarillo `#ffe900` solo para llamar la atención. El logo propio es un gatito canchero y minimalista entrenando.

| Token | Color | Uso en SP10 |
|---|---|---|
| --bg | #000000 | Fondo de la app |
| --surface | #2a2a2a | Tarjetas y barra inferior |
| --muted | #606060 | Texto secundario, bordes, íconos inactivos |
| --fg | #ffffff | Texto principal |
| --accent | #ffe900 | Solo para atención: botón principal, racha activa, meta cumplida, pestaña activa |

**Regla de color (decisión de la dueña, reemplaza la del manual)**: la botonera inferior es amarilla (pestaña activa en pastilla negra) y los botones de acción principales son amarillos. Tarjetas, fondos y acciones secundarias en negro y grises.

**Tipografía**: Nunito (next/font). Extra Bold/Black (800-900) para números grandes y títulos (contador del ayuno, rachas); Bold para encabezados; Regular para texto.

**Personalidad**: fuerte, accesible, inclusivo, innovador, funcional; arquetipo creador/explorador (audaz, humano, minimalista, "te inspira sin imponerte"): pantallas limpias, mucho aire, botones grandes y textos cortos con humor.

### Logo SP10: gatito canchero
- Silueta de gato minimalista, de trazo grueso y geométrico, en pose de levantar una pesa (o con vincha), con media sonrisa y un ojo guiñado.
- Monocromático, en blanco o negro; versión de ícono con fondo amarillo #ffe900 y gato negro.
- Wordmark "SP10" en Nunito Black con kerning cerrado (-80 → `tracking-[-0.08em]`).
- La cola del gato hace una espiral que recuerda al huracán del isotipo BRAVE.
- Entregables: icon-512.png, icon-192.png, apple-touch-icon.png (180 px), favicon.svg, splash oscuro.

**Componentes clave**: tarjeta oscura con radio de 16 px, anillo de progreso con trazo amarillo, chips por día de la semana, bottom sheet para registrar y confeti amarillo al cumplir una meta.

## Roadmap después del MVP
1. v1.1, ajustes de uso real: frases nuevas, horarios de avisos afinados, widgets de iOS vía Atajos.
2. v1.2, Apple Watch vía Salud: un Atajo de iOS (o Health Auto Export) manda entrenos, calorías activas y peso a `/api/health/ingest`.
3. v1.3, acciones rápidas desde el reloj: Atajos en el Watch para "Rompí el ayuno", "Fui al gym" y "Tengo evento".
4. v1.4, plan de fuerza: rutinas simples por día (tren superior, inferior, core) con progreso de cargas.
5. v2, app nativa (opcional): SwiftUI + HealthKit. Supabase sigue siendo el backend.

## Plan de trabajo
Siete etapas cortas (0 a 6). Cada una termina con algo usable en el celular y un deploy en Vercel.

- Etapa 0, base: Next.js + TypeScript + Tailwind + shadcn/ui, tema BRAVE (tokens y Open Sans), layout con barra inferior y deploy inicial.
- Etapa 1, login y perfil: Supabase Auth con sesión persistente, allowlist por email, tabla profiles, pantalla de Ajustes (horario de ayuno, apodos, meta de fuerza).
- Etapa 2, ayuno y Hoy: tabla fast_days, contador en vivo, "Lo rompí" y "Extender", racha y pantalla Hoy.
- Etapa 3, entrenos y eventos: tablas workouts y events, plantilla semanal de fútbol, registro con un toque, anillo de fuerza 3/3, flujo de compensación.
- Etapa 4, cuerpo: body_checks, body_photos y bucket privado; control quincenal en 3 pasos, número oculto y comparador de fotos.
- Etapa 5, PWA y avisos: manifest, íconos del gatito, service worker, suscripción push, /api/cron/notify, pg_cron cada 15 min y banco de frases.
- Etapa 6, progreso: vistas v_week_summary y v_streaks, gráficos con Recharts y resumen del domingo.

## Decisiones tomadas
- **Login**: email + contraseña de Supabase Auth (sin Google ni magic link). Registro público desactivado; las cuentas las crea un admin desde el Panel Ringo (o a mano en Supabase → Authentication → Add user). `ALLOWED_EMAIL` ya no se usa.
- **Semana**: de lunes a domingo.
- **Supabase**: plan gratis, proyecto propio `sp10` en **us-west-2 (Oregon)** (se pausó otro proyecto para liberar el lugar).
- **Región Vercel**: funciones en `pdx1` (Portland), al lado de la base (`vercel.json`). Login y sesión se verifican con `auth.getClaims()` (JWT local, sin ida y vuelta al servidor de Auth); usar `getClaims()` en vez de `getUser()` salvo que haga falta el usuario fresco.
- **Ayuno**: cada fila de `fast_days` se identifica por la fecha en que ARRANCA (la noche). Sin fila = cumplido. La racha cuenta desde el día de creación del perfil; el ayuno en curso no suma y uno roto la corta. Botones **Empezar** (en la ventana abierta, guarda `started_at`; fin = inicio + 16 h) y **Terminar** (guarda `ended_at`; cumplido si llegó a las 16 h con 10 min de changüí, extendido si pasó 1 h o más, cortado si no). Sin tocar nada, el ayuno sigue el horario solo. Se puede extender hasta 2 h después de terminado solo, y "Seguir ayunando" deshace un Terminar de hace menos de 2 h. Tocando un día del calendario se carga o corrige (hasta 60 días atrás); la racha cuenta desde el primer día cargado. Lógica pura en `src/lib/fast.ts` con tests (`npm test`).
- **Entrenos**: `workouts.status` = `done` o `skipped` ("no fui" de la plantilla). La plantilla (`profiles.week_template`, día ISO → tipo) sugiere fútbol L/M/J/S; un día planeado que ya pasó esta semana sin confirmar muestra "¿Hubo fútbol?" con Fui / No fui. Registro con un toque en bottom sheet (hoy o ayer, minutos en chips, sensación para correr, nota). Tipos y constantes de cliente en `src/lib/training-types.ts`; datos del servidor en `src/lib/training.ts`.
- **Eventos**: crear un evento marca el ayuno de esa noche como `event` (no corta la racha) y, si la compensación incluye ayuno, le suma +2 h (primera comida 2 h más tarde). Fases en `src/lib/events.ts`: upcoming, tomorrow (preparar), today, compensate (día siguiente y el otro, 48 h), pending (sin castigo), compensated. La tarjeta de compensar va primera en Hoy.
- **Cuerpo**: un control por día (`body_checks` unique user_id+date; el wizard hace upsert del de hoy). Primer control en `profiles.body_check_start` (2026-11-16, editable en Ajustes); después cada 14 días desde el último (`src/lib/body.ts`). Tendencia de peso = último vs. promedio de hasta 3 anteriores, ±0,3 kg. Número oculto: tendencia visible, número al mantener apretado (400 ms). Fotos: se comprimen en el celular (1600 px JPEG) y se suben directo desde el navegador a `body-photos/{user_id}/{check_id}/{angle}.jpg`; se muestran con URLs firmadas de 1 h. Decimales con coma (`fmt`). Cualquier control se edita: `/cuerpo/control?id=…` (desde el historial o "Editar" en el último control) abre el mismo wizard precargado con datos y fotos; `saveCheck({ checkId })` actualiza ese control en vez de crear uno.
- **Logo**: gatito geométrico levantando una pesa, ojo guiñado, media sonrisa y cola en espiral. Fuente en `design/*.svg`; íconos PNG en `public/` (192, 512, maskable, apple-touch 180) y splash en `public/splash/`. Componente `CatLogo` (usa `currentColor`).
- **PWA**: `src/app/manifest.ts`, `public/sw.js` (push + abrir al tocar, sin caché offline), registro en `ServiceWorkerRegister`. En iOS los avisos solo andan con la app agregada a Inicio.
- **Avisos**: reglas puras en `src/lib/notify-rules.ts` (horas relativas al horario de ayuno de la dueña; margen de 30 min para que el cron no se los saltee; silencio 23:00-8:30) y frases en `src/lib/phrases.ts` (apodo al azar, sin repetir la última frase por tipo). `/api/cron/notify` (POST con `Authorization: Bearer CRON_SECRET`) usa el cliente service role, registra en `notification_log` (unique user+kind+ref, evita duplicados) antes de mandar, y borra suscripciones vencidas (404/410). Preferencias por tipo en `profiles.notify_prefs`. Ajustes genera las claves VAPID y el CRON_SECRET en el navegador si faltan. Programación: `supabase/scripts/cron.sql` (pg_cron cada 15 min + pg_net, secreto en Vault).
- **Velocidad**: `createClient` y `getProfile` envueltos en `React.cache` (una sola consulta de perfil por request); Hoy carga ayuno, entrenos y cuerpo en paralelo; `(tabs)/loading.tsx` muestra un esqueleto al instante; el botón rápido del cronómetro es optimista (cambia ya y después confirma el servidor). Las 5 pestañas se precargan completas (`prefetch` en la barra) y el router las guarda 30 s (`staleTimes` en `next.config.ts`; las acciones con `revalidatePath` la limpian). El middleware corre con `runtime: "nodejs"` en pdx1, al lado de Supabase.
- **Barra inferior**: pastilla amarilla flotante, íconos negros 22 px, pestaña activa en pastilla negra.
- **Progreso**: se calcula en TypeScript (`src/lib/progress.ts`, con tests) en lugar de las vistas `v_week_summary`/`v_streaks`: resumen de las últimas 12 semanas, racha de ayuno actual y récord, semanas seguidas con la meta de fuerza (la semana en curso suma solo si ya se cumplió), compensados seguidos (lo pendiente corta, lo que está en 48 h no). Gráficos con Recharts (`src/components/progress/charts.tsx`): una serie por gráfico en amarillo, tooltip al tocar; peso = promedio móvil de 3 controles y sin escala ni números si está el número oculto.
- **Identidad: Ringo** (antes SP10). Logo: perrito amarillo con vincha levantando una barra (`design/ringo-logo-original.png`). Derivados: `public/ringo-mark.png` (perrito, transparente), `public/ringo-logo.png` (perrito + palabra), íconos con fondo negro (`icon-192/512`, maskable, apple-touch, `src/app/icon.png`) y splash. Componentes `RingoMark` / `RingoLogo`. Amarillo del logo `#fdd111` (el `--accent` de la UI sigue en `#ffe900`). El repo sigue llamándose `sp10`.
- **Entrenos (v1.1)**: "Fuerza" se muestra como **Fierritos 💪🏻** y "correr" como **Carrera** (las claves internas `fuerza`/`correr` no cambian). `workouts.details` (jsonb, migración 0007): Fierritos guarda zonas Brazos/Core/Piernas con ejercicios, reps y vueltas; Carrera guarda kcal ≈ MET 8,3 × último peso (o 65 kg) × horas. Registro: día Hoy por defecto, Ayer u Otro día (hasta 60 atrás), minutos desde 30. Se sacaron las preguntas de la plantilla ("¿Hubo fútbol?") y las sugerencias punteadas: se carga lo que se hace. Hoy y Entrenos usan `TrainingCard`: encabezado "Entrenamientos · esta semana" y 4 bloques tocables (Fierritos X/meta, Carrera min + kcal, Fútbol y Pádel veces + min) que abren el registro con ese tipo ya elegido; semana con emojis; en Entrenos además "+ Registrar otro entreno" con todos los tipos (incluye Tenis 🎾, Squash ⚫ y Trekking 🥾, migraciones 0008 y 0010; Pádel pasó a 🏓). Los inputs de fecha/hora tienen un arreglo global en `globals.css` para que Safari iOS no los desborde. Al guardar un entreno aparece `Celebration`: "¡Esaaa! Así me gusta, {apodo}" con confeti amarillo (se cierra sola a los 2,2 s o con un toque). Progreso muestra fierritos por zona (12 semanas) junto al cambio de la medida asociada (brazos→brazo, core→cintura, piernas→pierna).
- **Ayuno (v1.1)**: avisos "Empezá tu ayuno" (a la hora de inicio) y "¿Ya empezaste?" (1 h después), solo si ese ayuno no tiene `started_at`/`ended_at`. Se quitó el aviso de confirmar fútbol. En Ayuno, "Ajustar hora de inicio" (`adjustStart`) guarda la hora real y el fin se recalcula; si la ventana está abierta, aplica al próximo ayuno.
- **Derrapes**: en la UI los eventos se llaman "derrapes" (botón "😈 Se viene un derrape"); en la base siguen siendo `events`.
- **¿Cómo venís? (nivel semanal)**: `src/lib/level.ts` (con tests). Cada lunes se califica la semana cerrada (L-D) con 0-100 (desde v1.4: objetivos de "Tu semana ideal" 85 + derrapes 15; ver abajo). Niveles: 💤 pajera <30, 🛋️ vagoneta 30+, 😐 promedio de la humanidad 45+, 🔥 motivada 60+, ⚡ crack 75+, 👑 nivel dios 90+. No se guarda: se recalcula de los datos (últimas 26 semanas) e incluye cuántas veces fue cada nivel. Solo se califican semanas COMPLETAS desde que empezó (`firstGradedWeek`: si empezó un domingo, la primera es la del lunes siguiente). La tarjeta muestra el desglose compacto (`scoreParts`: nombre, puntos, barrita y porqué de Ayuno/Fierritos/Extra/Derrapes; los derrapes arrancan en 15/15 y solo bajan con derrapes sin compensar: "ninguno pendiente") y lo que lleva sumado en la semana en curso. Tarjeta `LevelCard` arriba de todo en Hoy.
- **Etapas del ayuno**: `src/lib/fast-stages.ts` (con tests). Por horas transcurridas: 0 Digestión 🍽️, 4 Azúcar estable 📉, 8 Usando reservas 🔋, 12 Modo quemagrasa 🔥, 16 Cetosis 💪, 18 Autofagia ✨, 24 Nivel monje 🧘 (aproximadas, con aclaración en la UI). En Hoy: una línea con la etapa y cuánto falta para la próxima; en Ayuno: detalle con escalera de etapas.
- **Fin del ayuno con confirmación (v1.2)**: al llegar a la hora de fin, el ayuno NO se cierra solo: pasa a fase `overtime` (sigue contando, pregunta "¿Terminaste o seguís?" con Terminé / A otra hora / Sigo +1 h). Si en 6 h (`OVERTIME_MS`) no confirma, se da por terminado a la hora planeada. `endFast(hhmm?)` cierra ahora o a la hora real; en overtime, "Sigo" usa `extraHoursFor` (nuevo fin = ahora + N h). Avisos: `fast_done` = "¿Terminaste o seguís?" a la hora de fin y `fast_unconfirmed` 2 h después, solo si el ayuno no está cerrado (ref = fecha+extensión, así vuelve a preguntar si extendió). Ayuno muestra "Tus últimos ayunos" con inicio → fin y horas (reales o "según horario").
- **Pantallas simplificadas (v1.2)**: Entrenos = TrainingCard + "Esta semana" (solo si hay entrenos) + "Derrapes agendados" en filas (`EventList`: fecha, compensación, botón "✓ Compensé" cuando toca, borrar); el botón para agendar derrapes vive solo en Hoy. Cuerpo = tarjeta chica "Próximo control" + "+ Control", último control con medidas en filas (`Deltas compact`) y peso en una línea; "Antes / ahora" solo con 2+ controles con fotos; "Controles anteriores" solo desde el segundo control.
- **Calendario de ayunos**: 3 colores por tipo: blanco = cumplido, amarillo (`accent`) = extendido, violeta (`--event` #b794f6, `bg-event`) = derrape; cortado solo con borde, sin cargar tenue, en curso punteado.
- **Recién arranco (v1.2)**: mientras el ayuno figura en curso por horario, "↺ ¿Recién arrancás? Reiniciar desde ahora" (`RestartSheet` → `restartFast(markPreviousLost)`) pone `started_at = ahora` en el ayuno actual (en la ventana abierta, en el próximo) y, tildado por defecto, marca el ayuno anterior (`restartPrevDate`) como perdido: `status broken`, `broken_at = inicio` (queda 0 h, corta la racha).
- **Multiusuario (v1.3)**: Ringo es una sola app para varias usuarias; cada una ve solo lo suyo por RLS (todas las tablas y las fotos ya estaban por `user_id`). Roles en `profiles.role`: `admin`, `user` (default de cuentas nuevas) y `disabled` (pausada → `getProfile` redirige a `/restringido`). Migración 0009: roles + trigger `protect_role` (nadie se cambia el rol desde la app; solo el service role). **Panel Ringo** en `/admin` (`src/lib/admin-data.ts`, `requireAdmin()` da 404 a no-admins; acceso desde Ajustes): cuentas totales, activas en 7 días, nuevas, % con avisos, entrenos por tipo en 30 días y, por cuenta, último uso, ayunos marcados, entrenos, controles, derrapes y avisos. **Solo métricas de uso: nunca pesos, medidas ni fotos.** Acciones (service role, solo admin): crear cuenta (email + contraseña inicial, usuaria o admin), pausar/reactivar, hacer/quitar admin, nueva contraseña; no se puede cambiar el propio rol. Sin contraseña admin por defecto en el código (sería pública en el repo): el admin es la cuenta de la dueña.
- **Editar ayunos pasados (v1.3)**: tocando un ayuno en "Tus últimos ayunos" o en el calendario se abre `FastDaySheet`: Cumplido / No lo hice (broken con `broken_at = inicio` → 0 h) / +1 h / +2 h, o "horas reales" (`setFastTimes` + `resolveFastTimes`: inicio esa noche, o de madrugada si es antes de las 12; fin = primera vez que llega esa hora después del inicio; estado según `closeOutcome`), o "Volver al horario". Hasta 60 días atrás, solo ayunos ya terminados.
- **Deportes frecuentes (v1.3)**: `profiles.favorite_sports` (migración 0011, default fuerza/correr/fútbol/pádel, máx 4, el orden elegido es el de los bloques). Se eligen en Ajustes; `TrainingCard` muestra esos bloques (fierritos con X/meta, carrera con min + kcal, el resto veces + min).
- **Confirmar inicio (v1.3)**: si el ayuno en curso arrancó solo por horario (`startConfirmed = false`, sin `started_at`), la tarjeta del ayuno (Hoy y Ayuno) pregunta "Arrancó según tu horario (HH:MM). ¿Fue así?" con Sí (guarda `started_at` = hora del horario) / Empecé a otra hora (`StartAtSheet` → `adjustStart`, el fin se recalcula) / Recién arranco (`RestartSheet`). Confirmado, queda el link "🕐 Cambiar hora de inicio". Los sheets de hora se precargan con `useEffect` al abrirse.
- **Derrapes se compensan en su semana (v1.4)**: `compensateDeadline` = domingo de la semana del derrape (si fue domingo, el lunes). Fases en `src/lib/events.ts`: `compensate` (desde el día siguiente hasta ese plazo) y `missed` (cerró la semana sin compensar: queda "sin compensar", ya no se puede tildar, resta 7,5 en el nivel de esa semana y corta la racha de compensados). Ya no hay "pendiente". En Hoy la tarjeta de compensar (y los derrapes de hoy/mañana) van DEBAJO de entrenamientos. Aviso nuevo `compensation_last`: domingo 10:00, último día para compensar.
- **Tu semana ideal (v1.4)**: `profiles.weekly_goals` jsonb (migración 0012), ej. `{"ayuno":5,"fuerza":2,"futbol":1}`: veces por semana de ayunos y de cada deporte (0 = no cuenta). Sin configurar = 5 ayunos + `strength_goal`. Al guardar, `strength_goal` sigue a `fuerza`. Lógica en `src/lib/goals.ts` (`goalsOf`, `goalProgress`, `missingText`, `goalsText`): % = promedio de cada objetivo (hecho/meta, tope 1), todos pesan igual. Se edita en Ajustes (`WeeklyGoalsPicker`, con − / +). **El nivel semanal ahora sale de esto**: objetivos 85 pts repartidos en partes iguales + derrapes 15. `LevelCard` muestra "🎯 Tu semana va al X%", chips por objetivo y lo que falta. Aviso `week_goals` (reemplaza a "fierritos pendientes"): jueves y domingo 10:00 si no está al 100%, con % y lo que falta. El resumen del domingo arranca con el % de la semana.
- **Ringo Club (v1.5)**: 6.ª pestaña "Club" 🏆 (`/club`). Opt-in: `profiles.club_visible` + `club_name` (1-20 letras, migración 0013); quien no se sumó ve la invitación y no ve a nadie. `src/lib/club-data.ts` calcula con service role, SOLO para miembros (no `disabled`), el nivel de la última semana cerrada (`weekSummaries` de 2 semanas + `weekScore`) y el % de la semana en curso; devuelve únicamente nombre, nivel, puntos y %. **Nunca peso, medidas, fotos ni detalle de ayunos/entrenos.** Pantalla: ranking (🥇🥈🥉, la propia en amarillo), "Por nivel" (cuántas y quiénes en cada perrita), recién llegadas sin semana completa aparte, y cambiar nombre / salir del club.
- **Foto de perfil (v1.5)**: `profiles.avatar_path` + bucket `avatars` **público** con nombre aleatorio `{user_id}/{uuid}.jpg` (migración 0014; solo la dueña sube/borra su carpeta). Se recorta en cuadrado 512 px en el celular (`squareImage`), se sube directo desde el navegador y `setAvatar(path)` la guarda y borra la anterior. URL con `avatarUrl()` (`src/lib/avatar.ts`), componente `Avatar` (sin foto, 🐶). Se elige en Ajustes ("Tu foto") y aparece en `LevelCard` (en lugar del perrito), en la barra de arriba (reemplaza el engranaje, lleva a Ajustes; `TopBar` es async y usa `getProfile`) y en el Ringo Club (ranking y "Por nivel"). Las fotos del cuerpo siguen en su bucket privado.
- **Sin ayuno (v1.6)**: `profiles.fasting_enabled` (migración 0015, default true; `fastingOn(profile)` en `src/lib/profile.ts`). Se elige en Ajustes ("Hago ayuno intermitente"). Apagado: la pestaña Ayuno pasa a **Comida** 🍎 (`/alimentacion`, pantalla vacía "No hacés ayunos, ok… estamos trabajando en una nueva funcionalidad para tus hábitos saludables"; `/ayuno` redirige ahí y viceversa), Hoy no muestra la tarjeta del ayuno, Progreso no muestra la racha de ayuno, el ayuno no cuenta en la semana ideal ni en el nivel (`profileGoals`), no se mandan ni listan los avisos de ayuno (`FAST_KINDS`) y los derrapes solo se compensan con entreno. Los datos de ayuno no se borran: al reactivarlo vuelve todo. Pendiente: propuesta para quien hace dieta sin ayuno.
- **Avisos del coach (v1.7)**: 4 avisos que maneja SOLO el admin (Panel Ringo → "Avisos generales": prender/apagar para todas y "Probar en mi celu"); no aparecen en Ajustes de las usuarias. Estado en `app_settings` (key `coach_notify`, migración 0016; RLS sin políticas, solo service role; lo que falta = prendido). Lógica pura en `src/lib/coach-notify.ts` (con tests), frases en `phrases.ts` (`LEVEL_LINES`, `FORECAST_LINES`, `MILESTONE_LINES`; el banco arma la frase con `{linea}`, y `buildMessage` reemplaza variables antes que el apodo). (1) `level_result` lunes 9:30: perrita de la semana cerrada + si subió/bajó + puesto en el Club si es miembro. (2) `forecast` miércoles 13:00: proyecta el cierre (avance × 7/2,5) con tono según el % (≥100 ya cumplió, ≥50 adelantada, ≥30 en ritmo, si no atrasada). (3) `streak_milestone` 12:00: 7/14/30/60/100 días de ayuno (si hace ayuno) y, los lunes, 4/8/12 semanas seguidas de fierritos. (4) `idle` 18:00: 3 días sin anotar nada (y cuenta de 3+ días), máx. 1 por semana: "Hola, {apodo} perdida 👀…". El cron ahora carga todos los ayunos de cada usuaria (para la racha) y 13 semanas de entrenos/derrapes; el lunes del nivel también calcula el ranking del Club (incluye miembros sin avisos). Usa `summaryText` y `weekGoals` para el resumen y la semana ideal.
- **SQL**: las migraciones viven en `supabase/migrations/` y se pegan en el SQL Editor de Supabase (desde el entorno cloud no hay acceso directo a la base).

## Pendientes de la dueña
- Pasar el logo BRAVE en SVG para el footer (hoy es un wordmark de texto).

## Preguntas abiertas
- (ninguna por ahora)
