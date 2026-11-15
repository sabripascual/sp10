import { Card, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";

export default function AyunoPage() {
  return (
    <>
      <PageHeader title="Ayuno" subtitle="16:8, de 19:00 a 11:00." />
      <Card className="py-10 text-center">
        <p className="text-6xl font-extrabold tabular-nums tracking-tight">--:--</p>
        <CardDescription className="mt-2">Contador en vivo en la Etapa 2.</CardDescription>
      </Card>
    </>
  );
}
