import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { clubDirectory, clubRequests, getClubData } from "@/lib/club-data";
import { ClubDirectory } from "@/components/club/club-directory";
import Link from "next/link";
import { closedRanking, figuritaNumber } from "@/lib/club";
import { ClubTabs } from "@/components/club/club-tabs";
import { LiveSteps, Podium } from "@/components/club/club-views";
import { FiguritaReveal } from "@/components/club/figurita";
import { ClubManage, ClubSwitcher, CreateClub } from "@/components/club/club-manage";
import { headers } from "next/headers";

const dm = (date: string) => `${Number(date.slice(8))}/${Number(date.slice(5, 7))}`;

export default async function ClubPage({ searchParams }: { searchParams: Promise<{ figurita?: string; tab?: string; c?: string }> }) {
  const params = await searchParams;
  const { me, clubs, club, closedWeek, isMonday, daysLeft, members, myMissing } = await getClubData(params.c);
  // Desde un aviso: ?figurita=1 abre la figurita; ?tab=podio|vivo elige la pestaña; ?c= el club
  const startOnPodium = params.tab === "podio" ? true : params.tab === "vivo" ? false : isMonday;
  const defaultName = me.display_name?.split(" ")[0] ?? me.club_name ?? "";

  if (!club) {
    return (
      <>
        <PageHeader title="Ringo Club" subtitle="El ranking de las perritas." />
        <Card className="space-y-4">
          <div className="text-center text-6xl">🐶🏆</div>
          <div>
            <CardTitle>Todavía no estás en ningún club</CardTitle>
            <CardDescription className="mt-1">
              Armá tu club e invitá a tus amigas: durante la semana ven en qué escalón de perrita va cada una y el lunes sale el
              podio, con tu figurita para compartir. Las demás solo ven tu nombre, tu foto, tu nivel, tus puntos y el % de tu
              semana. Nunca tu peso, tus medidas ni tus fotos.
            </CardDescription>
          </div>
          <CreateClub defaultName={defaultName} className="w-full" label="+ Crear mi club" />
          <p className="text-center text-sm text-muted">¿Te pasaron un link de invitación? Abrilo y te sumás.</p>
        </Card>
        <Card className="mt-4 space-y-2">
          <div>
            <CardTitle>Clubes de Ringo</CardTitle>
            <CardDescription>En los públicos podés pedir entrar; los privados son solo con invitación.</CardDescription>
          </div>
          <ClubDirectory clubs={await clubDirectory(me.id)} defaultName={defaultName} />
        </Card>
      </>
    );
  }

  const ranked = closedRanking(members);
  const mine = ranked.find((m) => m.isMe);
  const pos = mine ? ranked.indexOf(mine) + 1 : 0;
  const [h, requests] = await Promise.all([headers(), club.role === "owner" ? clubRequests(club.id) : Promise.resolve([])]);
  const inviteUrl = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/club/unirse/${club.inviteCode}`;

  return (
    <>
      <PageHeader title={club.name} subtitle={isMonday ? `Cerró la semana del ${dm(closedWeek)} 🏁` : "¿Quién es la perrita más picante?"} />
      <div className="space-y-4">
        <Link
          href="/club/explorar"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-black text-accent-fg active:scale-[0.98]"
        >
          🔎 Explorar clubes
        </Link>
        <ClubSwitcher clubs={clubs} current={club.id} />

        {mine?.closed && (
          <FiguritaReveal
            autoOpen={isMonday || params.figurita === "1"}
            force={params.figurita === "1"}
            weekKey={`${closedWeek}-${club.id}`}
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
              clubName: club.name,
            }}
          />
        )}

        <ClubTabs
          startOnPodium={startOnPodium}
          live={<LiveSteps members={members} daysLeft={daysLeft} myMissing={myMissing} />}
          podium={<Podium members={members} weekLabel={dm(closedWeek)} />}
        />

        <ClubManage
          club={club}
          members={members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar, isMe: m.isMe, role: m.role }))}
          inviteUrl={inviteUrl}
          requests={requests}
        />


        <CreateClub defaultName={club.myName} className="w-full bg-surface text-fg" label="+ Crear otro club" />
      </div>
    </>
  );
}
