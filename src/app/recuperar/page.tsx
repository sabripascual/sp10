import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/forms";

export default function RecuperarPage() {
  return (
    <AuthShell title="¿Te olvidaste la contraseña?" subtitle="Tranqui, le pasa a las mejores. Dejanos tu WhatsApp y te mandamos una nueva.">
      <ResetForm />
    </AuthShell>
  );
}
