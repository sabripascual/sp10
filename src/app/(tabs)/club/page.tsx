import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { getClubData } from "@/lib/club-data";
import { closedRanking, figuritaNumber } from "@/lib/club";
import { JoinForm } from "./join-form";
import { ClubTabs } from "@/components/club/club-tabs";
import { LiveSteps, Podium } from "@/components/club/club-views";
import { FiguritaReveal } from "@/components/club/figurita";

const dm = (date: string) => `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;

export default async function ClubPage() {
  const { me, joined, closedWeek, isMonday, daysLeft, members, myMissing } = await getClubData();

  if (!joined) {
    return (
      <>
        <PageHeader title="Ringo Club" subtitle="El ranking de las perritas." />
        <Card className="space-y-4">
          <div className="text-center text-6xl">🐶🏆</div>
          <div>
            <CardTitle>¿Te sumás?</CardTitle>
            <CardDescription className="mt-1">
              Durante la semana ves en qué escalón de perrita va cada una y el lunes sale el podio, con tu figurita para
              mandar por WhatsApp. Las demás solo ven tu nombre, tu foto de perfil, tu nivel, tus puntos y el % de tu semana.
              Nunca tu peso, tus medidas ni tus fotos. Salís cuando quieras.
            </CardDescription>
          </div>
          <JoinForm initialName={me.club_name ?? ""} joined={false} />
        </Card>
      </>
    );
  }

  const ranked = closedRanking(members);
  const mine = ranked.find((m) => m.isMe);
  const pos = mine ? ranked.indexOf(mine) + 1 : 0;

  return (
    <>
      <PageHeader title="Ringo Club" subtitle={isMonday ? `Cerró la semana del ${dm(closedWeek)} 🏁` : "¿Quién es la perrita más picante?"} />
      <div className="space-y-4">
        {mine?.closed && (
          <FiguritaReveal
            autoOpen={isMonday}
            weekKey={closedWeek}
            d={{
              name: mine.name,
              avatar: mine.avatar,
              number: figuritaNumber(mine.id),
              level: mine.closed.level,
              score: mine.closed.score,
              pos,
              total: ranked.length,
              pct: mine.closed.pct,
              prevLevel: mine.prev?.level ?? null,
              week: dm(closedWeek),
            }}
          />
        )}

        <ClubTabs
          startOnPodium={isMonday}
          live={<LiveSteps members={members} daysLeft={daysLeft} myMissing={myMissing} />}
          podium={<Podium members={members} />}
        />

        <Card className="space-y-3">
          <div>
            <CardTitle>Tu lugar en el club</CardTitle>
            <CardDescription className="mt-1">Las demás ven tu nombre, tu foto de perfil, nivel, puntos y % de la semana. Nada más.</CardDescription>
          </div>
          <JoinForm initialName={me.club_name ?? ""} joined />
        </Card>
      </div>
    </>
  );
}
