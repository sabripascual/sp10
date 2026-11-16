import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { EventCard } from "@/components/training/event-cards";
import { EventSheet } from "@/components/training/event-sheet";
import { TrainingCard } from "@/components/training/training-card";
import { WorkoutList } from "@/components/training/workout-list";
import { getTrainingData } from "@/lib/training";

export default async function EntrenosPage() {
  const { profile, today, week, strengthDone, runMinutes, runKcal, weightKg, events } = await getTrainingData();
  const workouts = week.flatMap((d) => d.workouts).reverse();
  const firstMeal = profile.fast_end.slice(0, 5);

  return (
    <>
      <PageHeader title="Entrenos" subtitle="Semana de lunes a domingo." />
      <div className="space-y-4">
        <TrainingCard
          week={week}
          strengthDone={strengthDone}
          goal={profile.strength_goal}
          runMinutes={runMinutes}
          runKcal={runKcal}
          today={today}
          weightKg={weightKg}
          nicknames={profile.nicknames}
          showRegisterAll
        />

        {events.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-lg font-extrabold">Derrapes 😈</h2>
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
