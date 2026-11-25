import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { fastingOn, getProfile, randomNickname } from "@/lib/profile";

/** Para quien no hace ayuno: por ahora, pantalla vacía con onda. */
export default async function AlimentacionPage() {
  const profile = await getProfile();
  if (fastingOn(profile)) redirect("/ayuno");
  return (
    <>
      <PageHeader title="Alimentación" />
      <div className="flex flex-col items-center rounded-2xl bg-surface px-6 py-12 text-center">
        <div className="text-7xl">🥗🐶</div>
        <p className="mt-6 text-2xl font-black leading-tight">No hacés ayunos, ok {randomNickname(profile.nicknames)} 👌</p>
        <p className="mt-3 text-muted">Estamos trabajando en una nueva funcionalidad para tus hábitos saludables. Muy pronto, acá.</p>
        <p className="mt-8 text-xs text-muted">
          ¿Arrancaste con el ayuno? Activalo en{" "}
          <Link href="/ajustes" className="underline">
            Ajustes
          </Link>
          .
        </p>
      </div>
    </>
  );
}
