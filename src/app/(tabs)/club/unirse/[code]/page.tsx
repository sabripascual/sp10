import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/lib/profile";
import { inviteInfo, CLUB_MAX_MEMBERS } from "@/lib/club-data";
import { JoinInvite } from "@/components/club/club-manage";

/** Link de invitación a un club. */
export default async function UnirsePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [me, club] = await Promise.all([getProfile(), inviteInfo(code.toLowerCase())]);

  if (!club)
    return (
      <Card className="mt-6 space-y-2">
        <CardTitle>Este link no anda 🤔</CardTitle>
        <CardDescription>Revisá que esté completo o pedile el link de nuevo a quien te invitó.</CardDescription>
        <Link href="/club" className="block pt-2 text-sm underline">
          Ir al Club
        </Link>
      </Card>
    );

  const already = club.memberIds.includes(me.id);
  const full = club.memberCount >= CLUB_MAX_MEMBERS;
  return (
    <Card className="mt-6 space-y-4">
      <div className="text-center text-6xl">🐶🏆</div>
      <div className="text-center">
        <p className="text-sm text-muted">{club.ownerName} te invita a</p>
        <CardTitle className="text-2xl">{club.name}</CardTitle>
        <CardDescription className="mt-1">
          {club.memberCount} {club.memberCount === 1 ? "miembro" : "miembros"} · gana la más constante con su propia rutina.
        </CardDescription>
      </div>
      {already ? (
        <Link href={`/club?c=${club.id}`} className="flex h-14 items-center justify-center rounded-full bg-accent text-lg font-black text-accent-fg">
          Ya estás en este club: entrar
        </Link>
      ) : full ? (
        <p className="text-center text-sm font-bold">El club está lleno (máximo {CLUB_MAX_MEMBERS}).</p>
      ) : (
        <>
          <p className="text-xs text-muted">Las demás van a ver tu nombre en el club, tu foto, tu nivel, tus puntos y el % de tu semana. Nunca tu peso, medidas ni fotos.</p>
          <JoinInvite code={code.toLowerCase()} defaultName={me.display_name?.split(" ")[0] ?? me.club_name ?? ""} />
        </>
      )}
    </Card>
  );
}
