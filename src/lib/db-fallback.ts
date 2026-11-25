/**
 * Mientras no se corra una migración, una consulta con columnas nuevas falla.
 * Esto reintenta con la consulta vieja para que la app no se rompa.
 */
export async function withFallback<R extends { error: { message: string } | null }>(
  primary: PromiseLike<R>,
  fallback: () => PromiseLike<R>,
  columns = ["comp_detail", "compensated_by"],
): Promise<R> {
  const r = await primary;
  if (r.error && columns.some((c) => r.error!.message.includes(c))) return await fallback();
  return r;
}
