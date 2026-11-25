import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { FastTimer } from "@/components/fast/fast-timer";
import { EventCard } from "@/components/training/event-cards";
import { EventSheet } from "@/components/training/event-sheet";
import { TrainingCard } from "@/components/training/training-card";
import { getFastData, toView } from "@/lib/fast-data";
import { randomNickname } from "@/lib/profile";
import { getTrainingData } from "@/lib/training";
import { getProgressData } from "@/lib/progress-data";
import { LevelCard } from "@/components/progress/level-card";
import { getBodyData } from "@/lib/body-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HoyPage() {
  // Todo en paralelo: el perfil se pide una sola vez (React cache).
  const [fast, training, body, progress] = await Promise.all([
    getFastData(),
    getTrainingData(),
    getBodyData(undefined, { withPhotos: false }),
    getProgressData(),
  ]);
  const { profile, streak } = fast;
  const checkDue = body.nextDate <= body.today && body.checks.at(-1)?.date !== body.today;
  const apodo = randomNickname(profile.nicknames);
  const firstMeal = profile.fast_end.slice(0, 5);

  const toCompensate = training.events.filter((e) => e.phase === "compensate");
  const soon = training.events.filter((e) => e.phase === "today" || e.phase === "tomorrow");

  return (
    <>
      <PageHeader title={`Hola, ${apodo}`} subtitle="Esto es lo que toca hoy." />
      <div className="space-y-4">
        <LevelCard last={progress.level.last} counts={progress.level.counts} current={progress.weeks.at(-1)!} />

        <FastTimer view={toView(fast)} compact streak={streak} />

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

        <TrainingCard
          week={training.week}
          strengthDone={training.strengthDone}
          goal={profile.strength_goal}
          runMinutes={training.runMinutes}
          runKcal={training.runKcal}
          today={training.today}
          weightKg={training.weightKg}
          nicknames={profile.nicknames}
          favorites={profile.favorite_sports}
        />

        {/* Derrapes: después de lo importante (ayuno y entrenos) */}
        {[...toCompensate, ...soon].map((ev) => (
          <EventCard key={ev.id} ev={ev} firstMeal={firstMeal} today={training.today} />
        ))}

        <EventSheet today={training.today} className="w-full" />
      </div>
    </>
  );
}
