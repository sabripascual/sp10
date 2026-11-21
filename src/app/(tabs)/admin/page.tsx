import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { AccountList } from "@/components/admin/account-list";
import { CreateAccount } from "@/components/admin/create-account";
import { getAdminStats, requireAdmin } from "@/lib/admin-data";
import { TYPE_EMOJI, TYPE_LABEL, type WorkoutType } from "@/lib/training-types";

export const dynamic = "force-dynamic";

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-3xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
    </div>
  );
}

export default async function AdminPage() {
  const me = await requireAdmin();
  const s = await getAdminStats();
  const pct = (n: number) => (s.total ? `${Math.round((n / s.total) * 100)}%` : "—");

  return (
    <>
      <PageHeader title="Panel Ringo 🐶" subtitle="Cómo se usa Ringo. Solo uso: nada de pesos ni fotos." />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Stat value={s.total} label="cuentas" />
          <Stat value={s.active7} label="activas esta semana" />
          <Stat value={s.new7} label="nuevas esta semana" />
          <Stat value={pct(s.withPush)} label="con avisos activos" />
        </div>

        {s.workoutsByType.length > 0 && (
          <Card className="space-y-2">
            <CardTitle>Entrenos de los últimos 30 días</CardTitle>
            <ul className="space-y-1.5">
              {s.workoutsByType.map((w) => (
                <li key={w.type} className="flex items-center justify-between text-sm">
                  <span>
                    {TYPE_EMOJI[w.type as WorkoutType] ?? "✨"} {TYPE_LABEL[w.type as WorkoutType] ?? w.type}
                  </span>
                  <span className="font-black tabular-nums">{w.count}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="space-y-2">
          <div>
            <CardTitle>Cuentas</CardTitle>
            <CardDescription>Tocá una para pausarla, hacerla admin o cambiarle la contraseña.</CardDescription>
          </div>
          <AccountList accounts={s.accounts} meId={me.id} />
        </Card>

        <Card className="space-y-3">
          <div>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Le pasás el email y la contraseña a tu amiga. Después la puede cambiar con vos desde acá.</CardDescription>
          </div>
          <CreateAccount />
        </Card>
      </div>
    </>
  );
}
