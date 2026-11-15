import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { getProfile, randomNickname } from "@/lib/profile";

export default async function HoyPage() {
  const profile = await getProfile();
  const apodo = randomNickname(profile.nicknames);
  return (
    <>
      <PageHeader title={`Hola, ${apodo}`} subtitle="Esto es lo que toca hoy." />
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
