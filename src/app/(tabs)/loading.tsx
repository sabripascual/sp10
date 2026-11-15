/** Esqueleto mientras carga: la pestaña responde al toque al instante. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Cargando">
      <div className="mb-6 h-9 w-48 rounded-xl bg-surface" />
      <div className="h-40 rounded-2xl bg-surface" />
      <div className="h-14 rounded-2xl bg-surface" />
      <div className="h-28 rounded-2xl bg-surface" />
      <div className="h-28 rounded-2xl bg-surface" />
    </div>
  );
}
