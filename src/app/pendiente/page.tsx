import { signOut } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

export default function PendientePage() {
  return (
    <AuthShell back={false}>
      <div className="mt-8 space-y-3 rounded-2xl bg-surface p-6 text-center">
        <p className="text-5xl">🐶</p>
        <h1 className="text-2xl font-black">Tu cuenta está esperando aprobación</h1>
        <p className="text-muted">Te avisamos por WhatsApp apenas esté activa. Mientras, andá calentando motores 💪🏻</p>
      </div>
      <form action={signOut} className="mt-6">
        <Button type="submit" className="w-full bg-surface">
          Salir
        </Button>
      </form>
    </AuthShell>
  );
}
