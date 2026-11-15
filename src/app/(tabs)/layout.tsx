import { BottomNav } from "@/components/shell/bottom-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Footer } from "@/components/shell/footer";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-md px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2">
        {children}
        <Footer />
      </main>
      <BottomNav />
    </>
  );
}
