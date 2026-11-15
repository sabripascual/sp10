import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { EventCard } from "@/components/training/event-cards";
import { EventSheet } from "@/components/training/event-sheet";
import { PlannedConfirm } from "@/components/training/planned-confirm";
import { RegisterSheet } from "@/components/training/register-sheet";
import { StrengthCard } from "@/components/training/strength-card";
import { WeekStrip } from "@/components/training/week-strip";
import { WorkoutList } from "@/components/training/workout-list";
import { getTrainingData } from "@/lib/training";

export default async function EntrenosPage() {
  const { profile, today, week, strengthDone, runMinutes, events } = await getTrainingData();
  const toConfirm = week.filter((d) => d.awaitingConfirm).reverse();
  const workouts = week.flatMap((d) => d.workouts).reverse();
  const firstMeal = profile.fast_end.slice(0, 5);

  return (
    <>
      <PageHeader title="Entrenos" subtitle="Semana de lunes a domingo." />
      <div className="space-y-4">
        <StrengthCard done={strengthDone} goal={profile.strength_goal} runMinutes={runMinutes} today={today} />

        <Card>
          <WeekStrip week={week} />
        </Card>

        <RegisterSheet today={today} label="Registrar entreno" className="w-full" />

        {toConfirm.map((d) => (
          <PlannedConfirm key={d.date} day={d} />
        ))}

        {events.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-lg font-extrabold">Eventos</h2>
            {events.map((ev) => (
              <EventCard key={ev.id} ev={ev} firstMeal={firstMeal} />
            ))}
          </div>
        )}
        <EventSheet today={today} className="w-full" />

        <Card>
          <CardTitle className="mb-2">Esta semana</CardTitle>
          <WorkoutList workouts={workouts} />
        </Card>
      </div>
    </>
  );
}
