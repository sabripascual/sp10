import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Footer } from "@/components/shell/footer";
import { fastingOn, getProfile } from "@/lib/profile";
import { TempPasswordPrompt } from "@/components/auth/password-forms";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  // Último ingreso (para el Panel): se guarda después de responder, como mucho cada 10 min
  const seen = profile.last_seen_at ? Date.parse(profile.last_seen_at) : 0;
  if (Date.now() - seen > 10 * 60_000) {
    const supabase = await createClient();
    after(async () => {
      await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id);
    });
  }
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-md px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2">
        {children}
        <Footer />
      </main>
      <BottomNav fasting={fastingOn(profile)} />
      {profile.must_change_password && <TempPasswordPrompt />}
    </>
  );
}
