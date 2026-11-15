import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";

export default function HoyPage() {
  return (
    <>
      <PageHeader title="Hola, crack" subtitle="Esto es lo que toca hoy." />
      <div className="space-y-4">
        <Card>
          <CardTitle>Ayuno</CardTitle>
          <CardDescription>El contador llega en la Etapa 2.</CardDescription>
        </Card>
        <Card>
          <CardTitle>Qué toca hoy</CardTitle>
          <CardDescription>Fútbol sugerido, fuerza pendiente y compensaciones (Etapa 3).</CardDescription>
        </Card>
        <Card>
          <CardTitle>Rachas</CardTitle>
          <CardDescription>Ayuno, fuerza 3/3 y compensados (Etapa 6).</CardDescription>
        </Card>
      </div>
    </>
  );
}
