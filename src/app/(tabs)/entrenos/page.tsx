import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { PageHeader } from "@/components/shell/page-header";
import { RegisterSheet } from "./register-sheet";

const days = ["L", "M", "M", "J", "V", "S", "D"];

export default function EntrenosPage() {
  return (
    <>
      <PageHeader title="Entrenos" subtitle="Semana de lunes a domingo." />
      <div className="space-y-4">
        <Card className="flex items-center gap-5">
          <ProgressRing value={0} max={3}>
            <span className="text-3xl font-extrabold">0/3</span>
          </ProgressRing>
          <div>
            <CardTitle>Fuerza</CardTitle>
            <CardDescription>Meta semanal. Arrancamos cuando quieras.</CardDescription>
          </div>
        </Card>
        <Card>
          <ul className="grid grid-cols-7 gap-1.5">
            {days.map((d, i) => (
              <li
                key={i}
                className="grid h-12 place-items-center rounded-xl border border-muted/50 text-sm font-bold text-muted"
              >
                {d}
              </li>
            ))}
          </ul>
        </Card>
        <RegisterSheet />
      </div>
    </>
  );
}
