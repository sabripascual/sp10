import Link from "next/link";
import { signOut } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";

export default function RestringidoPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="mt-4 text-3xl font-extrabold">Acceso restringido</h1>
      <p className="mt-2 text-muted">Ringo es una app personal. Este espacio tiene dueña.</p>
      <form action={signOut} className="mt-8">
        <Button type="submit" variant="outline" className="w-full">
          Salir
        </Button>
      </form>
      <Link href="/login" className="mt-4 text-sm text-muted underline">
        Volver al login
      </Link>
    </main>
  );
}
