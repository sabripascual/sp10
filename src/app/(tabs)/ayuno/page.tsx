import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { FastActions } from "@/components/fast/fast-actions";
import { FastCalendar } from "@/components/fast/fast-calendar";
import { FastTimer } from "@/components/fast/fast-timer";
import { getFastData, toView } from "@/lib/fast-data";

export default async function AyunoPage() {
  const data = await getFastData();
  const view = toView(data);
  const { profile, streak } = data;

  return (
    <>
      <PageHeader
        title="Ayuno"
        subtitle={`16:8, de ${profile.fast_start.slice(0, 5)} a ${profile.fast_end.slice(0, 5)}.`}
      />
      <div className="space-y-4">
        <FastTimer view={view} />
        <FastActions view={view} />

        <Card className="flex items-center gap-5">
          <p className="text-5xl font-extrabold tabular-nums">{streak}</p>
          <div>
            <CardTitle>{streak === 1 ? "día de racha" : "días de racha"}</CardTitle>
            <CardDescription>
              {streak === 0 ? "Hoy arranca la cuenta. Vos podés." : "La racha no se cuida sola."}
            </CardDescription>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Últimos 30 días</CardTitle>
          <FastCalendar days={data.calendar} />
        </Card>
      </div>
    </>
  );
}
