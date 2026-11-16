import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { EventList } from "@/components/training/event-list";
import { TrainingCard } from "@/components/training/training-card";
import { WorkoutList } from "@/components/training/workout-list";
import { getTrainingData } from "@/lib/training";

export default async function EntrenosPage() {
  const { profile, today, week, strengthDone, runMinutes, runKcal, weightKg, events } = await getTrainingData();
  const workouts = week.flatMap((d) => d.workouts).reverse();

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

        {workouts.length > 0 && (
          <Card>
            <CardTitle className="mb-1">Esta semana</CardTitle>
            <WorkoutList workouts={workouts} />
          </Card>
        )}

        {events.length > 0 && (
          <Card>
            <CardTitle>Derrapes agendados 😈</CardTitle>
            <CardDescription>Los nuevos se agendan desde Hoy.</CardDescription>
            <EventList events={events} />
          </Card>
        )}
      </div>
    </>
  );
}
