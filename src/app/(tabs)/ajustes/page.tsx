import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";

export default function AjustesPage() {
  return (
    <>
      <PageHeader title="Ajustes" />
      <Card>
        <CardTitle>Horario de ayuno, apodos y meta de fuerza</CardTitle>
        <CardDescription>Se editan en la Etapa 1.</CardDescription>
      </Card>
    </>
  );
}
