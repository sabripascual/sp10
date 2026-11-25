import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Footer } from "@/components/shell/footer";
import { fastingOn, getProfile } from "@/lib/profile";
import { TempPasswordPrompt } from "@/components/auth/password-forms";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
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
