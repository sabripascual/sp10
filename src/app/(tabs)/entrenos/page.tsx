import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { profileGoals } from "@/lib/goals";
import { weekStart } from "@/lib/week";
import { PageHeader } from "@/components/shell/page-header";
import { EventList } from "@/components/training/event-list";
import { TrainingCard } from "@/components/training/training-card";
import { WorkoutList } from "@/components/training/workout-list";
import { getTrainingData } from "@/lib/training";
import { getProgressData } from "@/lib/progress-data";
import { ZonesCard } from "@/components/progress/zones-card";
import { ALL_TYPES, type WorkoutType } from "@/lib/training-types";

export default async function EntrenosPage({ searchParams }: { searchParams: Promise<{ registrar?: string }> }) {
  const { registrar } = await searchParams;
  const openType = registrar === "any" ? "any" : ALL_TYPES.includes(registrar as WorkoutType) ? (registrar as WorkoutType) : null;
  const { profile, today, week, strengthDone, runMinutes, runKcal, weightKg, events, recentStrength } = await getTrainingData();
  const workouts = week.flatMap((d) => d.workouts).reverse();
  // Fierritos por zona (antes en Progreso): solo si los registrás en detallado
  const zones = profile.strength_mode === "detailed" ? await getProgressData() : null;

  return (
    <>
      <PageHeader title="Entrenos" subtitle="Semana de lunes a domingo." />
      <div className="space-y-4">
        <TrainingCard
          week={week}
          strengthDone={strengthDone}
          goal={profileGoals(profile, weekStart(today)).fuerza ?? profile.strength_goal}
          runMinutes={runMinutes}
          runKcal={runKcal}
          today={today}
          weightKg={weightKg}
          nicknames={profile.nicknames}
          favorites={profile.favorite_sports}
          strengthMode={profile.strength_mode}
          recentStrength={recentStrength}
          showRegisterAll
          openType={openType}
        />

        {zones && <ZonesCard zones={zones.zones} checks={zones.checks} />}

        {workouts.length > 0 && (
          <Card>
            <CardTitle className="mb-1">Esta semana</CardTitle>
            <WorkoutList workouts={workouts} />
          </Card>
        )}

        {events.length > 0 && (
          <Card>
            <CardTitle>Derrapes agendados 😈</CardTitle>
            <CardDescription>
              Te sirven para ver cuándo te salís de tu rutina. Son para tu motivación: no cuentan para tu nivel ni el ranking. Los nuevos se agendan desde Hoy.
            </CardDescription>
            <EventList events={events} />
          </Card>
        )}
      </div>
    </>
  );
}
