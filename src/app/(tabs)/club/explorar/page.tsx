import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { getProfile } from "@/lib/profile";
import { clubDirectory } from "@/lib/club-data";
import { ClubDirectory } from "@/components/club/club-directory";
import { CreateClub } from "@/components/club/club-manage";

/** Todos los clubes de Ringo: en los públicos se pide entrar; los privados son solo con invitación. */
export default async function ExplorarPage() {
  const me = await getProfile();
  const clubs = await clubDirectory(me.id);
  const name = me.display_name?.split(" ")[0] ?? me.club_name ?? "";
  return (
    <>
      <PageHeader title="Explorar clubes" subtitle="En los públicos podés pedir entrar; los privados son solo con invitación." />
      <div className="space-y-4">
        <div className="rounded-2xl bg-surface px-5 py-2">
          <ClubDirectory clubs={clubs} defaultName={name} />
        </div>
        <CreateClub defaultName={name} className="w-full bg-surface text-fg" label="+ Crear mi propio club" />
        <Link href="/club" className="block text-center text-sm text-muted underline">
          Volver al Club
        </Link>
      </div>
    </>
  );
}
