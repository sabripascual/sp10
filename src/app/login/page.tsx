import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";
import { Footer } from "@/components/shell/footer";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <p className="text-6xl font-extrabold tracking-[-0.08em]">SP10</p>
      <p className="mt-2 mb-10 text-muted">Tu coach de bolsillo. Entrá y metéle.</p>
      {isSupabaseConfigured ? (
        <LoginForm />
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
