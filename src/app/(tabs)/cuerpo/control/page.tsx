import { PageHeader } from "@/components/shell/page-header";
import { CheckWizard } from "@/components/body/check-wizard";
import { getBodyData } from "@/lib/body-data";

export default async function ControlPage() {
  const { profile, userId, today, checks } = await getBodyData();
  const existing = checks.find((c) => c.date === today) ?? null;
  return (
    <>
      <PageHeader title="Nuevo control" subtitle="Tres pasos, todos se pueden saltear." />
      <CheckWizard
        userId={userId}
        today={today}
        hideWeight={profile.hide_weight}
        previous={checks.filter((c) => c.date < today)}
        existing={existing}
      />
    </>
  );
}
