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

  return (
    <>
      <PageHeader title="Cuerpo" subtitle="Es solo un dato, no un juicio." />
      <div className="space-y-4">
        <Card className="space-y-4">
          <div>
            <CardTitle>{doneToday ? "Control de hoy cargado" : `Próximo control: ${shortDate(nextDate)}`}</CardTitle>
            <CardDescription className="mt-1">
              {doneToday ? "Podés completarlo o agregar fotos." : nextLabel(days)}
            </CardDescription>
          </div>
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href="/cuerpo/control">{doneToday ? "Editar el de hoy" : "Nuevo control"}</Link>
          </Button>
        </Card>

        {last && (
          <Card className="space-y-4">
            <CardTitle>Último control · {shortDate(last.date)}</CardTitle>
            <Deltas rows={measureDeltas(checks, last)} />
            <WeightValue
              weight={last.weight_kg === null ? null : Number(last.weight_kg)}
              trend={weightTrend(checks)}
              hidden={profile.hide_weight}
            />
          </Card>
        )}

        {checks.length > 0 && (
          <Card className="space-y-3">
            <CardTitle>Antes / ahora</CardTitle>
            <PhotoCompare checks={checks} />
          </Card>
        )}

        {checks.length > 0 && (
          <Card className="space-y-3">
            <CardTitle>Controles</CardTitle>
            <CheckHistory checks={checks} />
          </Card>
        )}
      </div>
    </>
  );
}
