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

export default async function HoyPage() {
  const fast = await getFastData();
  const { profile, streak } = fast;
  const training = await getTrainingData(profile);
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
