import { formatInTimeZone } from "date-fns-tz";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { FastTimer } from "@/components/fast/fast-timer";
import { getFastData, toView } from "@/lib/fast-data";
import { randomNickname } from "@/lib/profile";

const ACTIVITY: Record<string, string> = {
  futbol: "fútbol",
  fuerza: "fuerza",
  correr: "correr",
  padel: "pádel",
};

export default async function HoyPage() {
  const data = await getFastData();
  const { profile, now, streak } = data;
  const apodo = randomNickname(profile.nicknames);
  const isoDay = formatInTimeZone(now, profile.timezone, "i");
  const planned = profile.week_template[isoDay];

  return (
    <>
      <PageHeader title={`Hola, ${apodo}`} subtitle="Esto es lo que toca hoy." />
      <div className="space-y-4">
        <FastTimer view={toView(data)} compact />

        <Card>
          <CardTitle>Qué toca hoy</CardTitle>
          <CardDescription className="mt-1">
            {planned
              ? `Hoy hay ${ACTIVITY[planned] ?? planned}. A romperla.`
              : "Día libre de agenda: ideal para meterle fuerza."}
          </CardDescription>
        </Card>

        <Card className="flex items-center gap-5">
          <p className="text-5xl font-extrabold tabular-nums">{streak}</p>
          <div>
            <CardTitle>Racha de ayuno</CardTitle>
            <CardDescription>
              {streak === 0 ? "Hoy arranca la cuenta." : `${streak} ${streak === 1 ? "día" : "días"} al hilo. Sos una máquina.`}
            </CardDescription>
          </div>
        </Card>
      </div>
    </>
  );
}
