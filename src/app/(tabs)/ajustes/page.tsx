import { signOut } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/page-header";
import { getProfile } from "@/lib/profile";
import { SettingsForm } from "./settings-form";

export default async function AjustesPage() {
  const profile = await getProfile();
  return (
    <>
      <PageHeader title="Ajustes" />
      <SettingsForm profile={profile} />
      <form action={signOut} className="mt-8">
        <Button type="submit" variant="ghost" className="w-full text-muted">
          Cerrar sesión
        </Button>
      </form>
    </>
  );
}
