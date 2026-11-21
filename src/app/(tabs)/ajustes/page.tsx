import Link from "next/link";
import { signOut } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { KeyGenerator } from "@/components/pwa/key-generator";
import { PushSettings } from "@/components/pwa/push-settings";
import { getProfile } from "@/lib/profile";
import { SettingsForm } from "./settings-form";

export default async function AjustesPage() {
  const profile = await getProfile();
  const vapid = process.env.VAPID_PUBLIC_KEY;
  return (
    <>
      <PageHeader title="Ajustes" />
      {profile.role === "admin" && (
        <Link href="/admin" className="mb-4 flex items-center justify-between rounded-2xl bg-accent px-5 py-4 font-black text-accent-fg">
          🐶 Panel Ringo
          <span aria-hidden>→</span>
        </Link>
      )}
      <Card id="avisos" className="mb-4 scroll-mt-20 space-y-4">
        <div>
          <CardTitle>Avisos</CardTitle>
          <CardDescription>Te escribo con apodo y onda. Activá los que quieras.</CardDescription>
        </div>
        {vapid ? <PushSettings vapidPublicKey={vapid} prefs={profile.notify_prefs ?? {}} /> : <KeyGenerator />}
      </Card>
      <SettingsForm profile={profile} />
      <form action={signOut} className="mt-8">
        <Button type="submit" variant="ghost" className="w-full text-muted">
          Cerrar sesión
        </Button>
      </form>
    </>
  );
}
