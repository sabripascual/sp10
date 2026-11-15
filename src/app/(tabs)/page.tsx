import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { FastTimer } from "@/components/fast/fast-timer";
import { EventCard } from "@/components/training/event-cards";
import { EventSheet } from "@/components/training/event-sheet";
import { PlannedConfirm } from "@/components/training/planned-confirm";
import { StrengthCard } from "@/components/training/strength-card";
import { getFastData, toView } from "@/lib/fast-data";
import { randomNickname } from "@/lib/profile";
import { getTrainingData } from "@/lib/training";
import { getBodyData } from "@/lib/body-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HoyPage() {
  // Todo en paralelo: el perfil se pide una sola vez (React cache).
  const [fast, training, body] = await Promise.all([
    getFastData(),
    getTrainingData(),
    getBodyData(undefined, { withPhotos: false }),
  ]);
  const { profile, streak } = fast;
  const checkDue = body.nextDate <= body.today && body.checks.at(-1)?.date !== body.today;
  const apodo = randomNickname(profile.nicknames);
  const todayPlan = training.week.find((d) => d.isToday)!;
  const firstMeal = profile.fast_end.slice(0, 5);

  const toCompensate = training.events.filter((e) => e.phase === "compensate" || e.phase === "pending");
  const soon = training.events.filter((e) => e.phase === "today" || e.phase === "tomorrow");

  return (
    <>
      <PageHeader title={`Hola, ${apodo}`} subtitle="Esto es lo que toca hoy." />
      <div className="space-y-4">
        {toCompensate.map((ev) => (
          <EventCard key={ev.id} ev={ev} firstMeal={firstMeal} />
        ))}

        <FastTimer view={toView(fast)} compact />

        {soon.map((ev) => (
          <EventCard key={ev.id} ev={ev} firstMeal={firstMeal} />
        ))}

        {checkDue && (
          <Card className="space-y-3">
            <div>
              <CardTitle>📏 Toca control</CardTitle>
              <CardDescription className="mt-1">Es solo un dato, no un juicio. Tres pasos y listo.</CardDescription>
            </div>
            <Button asChild variant="primary" className="w-full">
              <Link href="/cuerpo/control">Hacer el control</Link>
            </Button>
          </Card>
        )}

        {todayPlan.awaitingConfirm && <PlannedConfirm day={todayPlan} />}

        <StrengthCard
          done={training.strengthDone}
          goal={profile.strength_goal}
          runMinutes={training.runMinutes}
          today={training.today}
        />

        <Card className="flex items-center gap-5">
          <p className="text-5xl font-black tabular-nums">{streak}</p>
          <div>
            <CardTitle>Racha de ayuno</CardTitle>
            <CardDescription>
              {streak === 0 ? "Hoy arranca la cuenta." : `${streak} ${streak === 1 ? "día" : "días"} al hilo. Sos una máquina.`}
            </CardDescription>
          </div>
        </Card>

        <EventSheet today={training.today} className="w-full" />
      </div>
    </>
  );
}
