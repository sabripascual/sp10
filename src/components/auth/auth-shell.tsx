import Link from "next/link";
import { RingoLogo } from "@/components/brand/ringo-logo";
import { Footer } from "@/components/shell/footer";

/** Marco de las pantallas sin sesión (login, registro, recuperar). */
export function AuthShell({ title, subtitle, children, back = true }: { title?: string; subtitle?: string; children: React.ReactNode; back?: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <RingoLogo className="mb-2 w-44" />
      {title && <h1 className="mt-6 text-3xl font-black tracking-tight">{title}</h1>}
      {subtitle && <p className="mt-1 mb-6 text-muted">{subtitle}</p>}
      {children}
      {back && (
        <Link href="/login" className="mt-6 text-center text-sm text-muted underline">
          Volver al login
        </Link>
      )}
      <Footer />
    </main>
  );
}
