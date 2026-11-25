import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/forms";

export default function RegistroPage() {
  return (
    <AuthShell title="Sumate a Ringo" subtitle="La constancia se gana compitiendo. Creá tu cuenta y te habilitamos al toque.">
      <SignUpForm />
    </AuthShell>
  );
}
