import { PageHeader } from "@/components/shell/page-header";
import { CheckWizard } from "@/components/body/check-wizard";
import { getBodyData } from "@/lib/body-data";
import { shortDate } from "@/lib/week";

/** Nuevo control, o edición de uno existente con ?id=… */
export default async function ControlPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const { profile, userId, today, checks } = await getBodyData();
  const existing = (id ? checks.find((c) => c.id === id) : checks.find((c) => c.date === today)) ?? null;
  const date = existing?.date ?? today;
  return (
    <>
      <PageHeader
        title={existing ? "Editar control" : "Nuevo control"}
        subtitle={existing ? `Control del ${shortDate(date)}. Cambiá lo que quieras.` : "Tres pasos, todos se pueden saltear."}
      />
      <CheckWizard
        key={existing?.id ?? "nuevo"}
        userId={userId}
        today={today}
        hideWeight={profile.hide_weight}
        previous={checks.filter((c) => c.date < date)}
        existing={existing}
      />
    </>
  );
}
