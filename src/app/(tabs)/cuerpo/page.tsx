import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { CheckHistory } from "@/components/body/check-history";
import { Deltas } from "@/components/body/deltas";
import { PhotoCompare } from "@/components/body/photo-compare";
import { WeightValue } from "@/components/body/weight-value";
import { daysBetween, measureDeltas, weightTrend } from "@/lib/body";
import { getBodyData } from "@/lib/body-data";
import { shortDate } from "@/lib/week";

function nextLabel(days: number) {
  if (days < 0) return "Se pasó la fecha, sin drama: cuando quieras.";
  if (days === 0) return "¡Hoy toca control!";
  if (days === 1) return "Mañana toca control.";
  return `Faltan ${days} días.`;
}

export default async function CuerpoPage() {
  const { profile, today, checks, nextDate } = await getBodyData();
  const last = checks.at(-1);
  const days = daysBetween(today, nextDate);
  const doneToday = last?.date === today;
  const withPhotos = checks.filter((c) => Object.keys(c.photos).length > 0).length;

  return (
    <>
      <PageHeader title="Cuerpo" subtitle="Es solo un dato, no un juicio." />
      <div className="space-y-4">
        <Card className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle>{doneToday ? "Control de hoy listo" : `Próximo: ${shortDate(nextDate)}`}</CardTitle>
            <CardDescription>{doneToday ? "Podés sumarle fotos o medidas." : nextLabel(days)}</CardDescription>
          </div>
          <Button asChild variant="primary" className="shrink-0">
            <Link href="/cuerpo/control">{doneToday ? "Completar" : "+ Control"}</Link>
          </Button>
        </Card>

        {last && (
          <Card className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Último control · {shortDate(last.date)}</CardTitle>
              <Link href={`/cuerpo/control?id=${last.id}`} className="rounded-full bg-bg px-3 py-1.5 text-xs font-bold">
                Editar
              </Link>
            </div>
            <Deltas rows={measureDeltas(checks, last)} compact />
            {last.weight_kg !== null && (
              <div className="flex items-center justify-between border-t border-muted/30 pt-3">
                <span className="text-sm text-muted">Peso</span>
                <WeightValue weight={Number(last.weight_kg)} trend={weightTrend(checks)} hidden={profile.hide_weight} compact />
              </div>
            )}
          </Card>
        )}

        {withPhotos >= 2 && (
          <Card className="space-y-3">
            <CardTitle>Antes / ahora</CardTitle>
            <PhotoCompare checks={checks} />
          </Card>
        )}

        {checks.length > 1 && (
          <Card className="space-y-3">
            <div>
              <CardTitle>Controles anteriores</CardTitle>
              <CardDescription>Tocá uno para verlo o editarlo.</CardDescription>
            </div>
            <CheckHistory checks={checks.slice(0, -1)} />
          </Card>
        )}
      </div>
    </>
  );
}
