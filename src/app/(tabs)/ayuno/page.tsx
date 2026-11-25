import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fastingOn, getProfile } from "@/lib/profile";
import { protocolLabel } from "@/lib/fast-protocol";
import { FastActions } from "@/components/fast/fast-actions";
import { FastCalendar } from "@/components/fast/fast-calendar";
import { FastTimer } from "@/components/fast/fast-timer";
import { FastHistory } from "@/components/fast/fast-history";
import { getFastData, toView } from "@/lib/fast-data";

export default async function AyunoPage() {
  if (!fastingOn(await getProfile())) redirect("/alimentacion");
  const data = await getFastData();
  const view = toView(data);
  const { profile, streak } = data;

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ayuno</h1>
          <p className="mt-1 text-muted">
            {protocolLabel(profile.fast_start, profile.fast_end)}, de {profile.fast_start.slice(0, 5)} a{" "}
            {profile.fast_end.slice(0, 5)}
          </p>
        </div>
        <Link href="/ajustes" className="rounded-full bg-surface px-4 py-2 text-sm font-bold">
          Cambiar
        </Link>
      </div>
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
          <CardTitle className="mb-2">Tus últimos ayunos</CardTitle>
          <FastHistory items={data.history} timezone={profile.timezone} />
        </Card>

        <Card>
          <CardTitle className="mb-4">Últimos 30 días</CardTitle>
          <FastCalendar days={data.calendar} timezone={profile.timezone} />
        </Card>
      </div>
    </>
  );
}
