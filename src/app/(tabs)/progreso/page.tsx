import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";

export default function ProgresoPage() {
  return (
    <>
      <PageHeader title="Progreso" subtitle="Rachas, gráficos y resúmenes." />
      <Card>
        <CardTitle>Resumen semanal</CardTitle>
        <CardDescription>Gráficos y rachas en la Etapa 6.</CardDescription>
      </Card>
    </>
  );
}
