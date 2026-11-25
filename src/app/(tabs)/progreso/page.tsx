import { getProgressData } from "@/lib/progress-data";
import { ProgresoView } from "@/components/progress/progreso-view";

export default async function ProgresoPage() {
  return <ProgresoView data={await getProgressData()} />;
}
