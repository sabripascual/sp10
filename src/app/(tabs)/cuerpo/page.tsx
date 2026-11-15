import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";

export default function CuerpoPage() {
  return (
    <>
      <PageHeader title="Cuerpo" subtitle="Es solo un dato, no un juicio." />
      <Card>
        <CardTitle>Control quincenal</CardTitle>
        <CardDescription>Peso, medidas y fotos llegan en la Etapa 4.</CardDescription>
      </Card>
    </>
  );
}
