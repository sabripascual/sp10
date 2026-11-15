import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-md px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-2">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
