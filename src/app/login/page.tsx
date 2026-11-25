import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";
import { Footer } from "@/components/shell/footer";
import { RingoLogo } from "@/components/brand/ringo-logo";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <RingoLogo className="mb-2 w-56" />
      <p className="mt-2 mb-10 text-muted">La constancia se gana compitiendo. Entrá y metéle.</p>
      {isSupabaseConfigured ? (
        <>
          {next?.startsWith("/club/unirse/") && (
            <p className="mb-4 rounded-2xl bg-surface p-4 text-sm font-bold">🏆 Te invitaron a un club. Entrá (o creá tu cuenta) y te sumás.</p>
          )}
          <LoginForm next={next} />
          <div className="mt-5 flex flex-col items-center gap-3 text-sm">
            <Link href="/recuperar" className="text-muted underline">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link href="/registro" className="font-bold">
              ¿No tenés cuenta? <span className="text-accent underline">Creala</span>
            </Link>
          </div>
        </>
      ) : (
        <p className="rounded-2xl bg-surface p-5 text-sm">
          Falta configurar Supabase: cargá <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en Vercel y volvé a deployar.
        </p>
      )}
      <Footer />
    </main>
  );
}
