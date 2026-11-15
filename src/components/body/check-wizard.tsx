"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { saveCheck, savePhoto } from "@/app/(tabs)/cuerpo/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ANGLES, MEASURES, measureDeltas, weightTrend, type Angle, type BodyCheck, type Measure } from "@/lib/body";
import { cn } from "@/lib/utils";
import { compressImage } from "./compress";
import { Deltas } from "./deltas";
import { WeightValue } from "./weight-value";

const inputClass =
  "h-14 w-full rounded-2xl bg-bg px-4 text-2xl font-black tabular-nums text-fg outline-none focus:ring-2 focus:ring-accent";

const STEPS = ["Peso", "Medidas", "Fotos", "Listo"];

export function CheckWizard({
  userId,
  today,
  hideWeight,
  previous,
  existing,
}: {
  userId: string;
  today: string;
  hideWeight: boolean;
  previous: BodyCheck[]; // controles anteriores a hoy
  existing: BodyCheck | null; // si ya hay un control hoy
}) {
  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState(existing?.weight_kg?.toString() ?? "");
  const [measures, setMeasures] = useState<Partial<Record<Measure, string>>>(
    Object.fromEntries(MEASURES.map(({ key }) => [key, existing?.[key]?.toString() ?? ""])),
  );
  const [checkId, setCheckId] = useState<string | null>(existing?.id ?? null);
  const [photos, setPhotos] = useState<Partial<Record<Angle, string>>>({});
  const [uploading, setUploading] = useState<Angle | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = (next: number) =>
    start(async () => {
      const res = await saveCheck({ weight, measures });
      if (res.error) return setError(res.error);
      setError(null);
      setCheckId(res.id!);
      setStep(next);
    });

  const upload = async (angle: Angle, file: File) => {
    if (!checkId) return;
    setUploading(angle);
    setError(null);
    try {
      const blob = await compressImage(file);
      const path = `${userId}/${checkId}/${angle}.jpg`;
      const { error: upErr } = await createClient()
        .storage.from("body-photos")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw new Error(upErr.message);
      const res = await savePhoto(checkId, angle);
      if (res.error) throw new Error(res.error);
      setPhotos((p) => ({ ...p, [angle]: URL.createObjectURL(blob) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setUploading(null);
    }
  };

  const current: BodyCheck = {
    id: checkId ?? "nuevo",
    date: today,
    note: null,
    weight_kg: weight ? Number(weight.replace(",", ".")) : null,
    ...(Object.fromEntries(
      MEASURES.map(({ key }) => [key, measures[key] ? Number(measures[key]!.replace(",", ".")) : null]),
    ) as Record<Measure, number | null>),
  };

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s} className="space-y-1 text-center">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-surface")} />
            <span className={cn("text-[11px] font-bold", i === step ? "text-fg" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="space-y-4">
          <div>
            <CardTitle>Paso 1 · Peso</CardTitle>
            <CardDescription>Es solo un dato, no un juicio. {hideWeight && "El número queda oculto."}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <input
              inputMode="decimal"
              placeholder="0,0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={inputClass}
              style={hideWeight ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
              autoComplete="off"
            />
            <span className="text-lg font-bold text-muted">kg</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-bg" onClick={() => { setWeight(""); setStep(1); }}>
              Saltear
            </Button>
            <Button variant="primary" onClick={() => setStep(1)}>
              Siguiente
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4">
          <div>
            <CardTitle>Paso 2 · Medidas</CardTitle>
            <CardDescription>En cm, todas opcionales. Medí siempre en el mismo lugar.</CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MEASURES.map(({ key, label }) => (
              <label key={key} className="space-y-1 text-sm text-muted">
                {label}
                <input
                  inputMode="decimal"
                  placeholder="—"
                  value={measures[key] ?? ""}
                  onChange={(e) => setMeasures((m) => ({ ...m, [key]: e.target.value }))}
                  className="h-12 w-full rounded-xl bg-bg px-4 text-lg font-bold tabular-nums text-fg outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-bg" onClick={() => setStep(0)}>
              Atrás
            </Button>
            <Button variant="primary" disabled={pending} onClick={() => save(2)}>
              {pending ? "Guardando…" : "Guardar y seguir"}
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <div>
            <CardTitle>Paso 3 · Fotos</CardTitle>
            <CardDescription>Misma luz, mismo lugar, misma pose. Quedan privadas, solo las ves vos.</CardDescription>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ANGLES.map(({ key, label }) => (
              <label
                key={key}
                className="relative grid aspect-[3/4] cursor-pointer place-items-center overflow-hidden rounded-xl bg-bg text-center"
              >
                {photos[key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[key]} alt={label} className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
                    <Camera className="size-6" />
                    {uploading === key ? "Subiendo…" : label}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading !== null}
                  onChange={(e) => e.target.files?.[0] && upload(key, e.target.files[0])}
                />
              </label>
            ))}
          </div>
          <Button variant="primary" size="lg" className="w-full" disabled={uploading !== null} onClick={() => setStep(3)}>
            {Object.keys(photos).length ? "Terminar" : "Saltear y terminar"}
          </Button>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card className="space-y-2 text-center">
            <p className="text-4xl">🎉</p>
            <CardTitle>¡Control cerrado!</CardTitle>
            <CardDescription>Constancia es la palabra. Nos vemos en 14 días.</CardDescription>
          </Card>
          <Card className="space-y-3">
            <CardTitle>Medidas vs. el anterior</CardTitle>
            <Deltas rows={measureDeltas([...previous, current], current)} />
          </Card>
          <Card className="space-y-2">
            <CardTitle>Peso</CardTitle>
            <WeightValue weight={current.weight_kg} trend={weightTrend([...previous, current])} hidden={hideWeight} />
          </Card>
          <Button asChild variant="primary" size="lg" className="w-full">
            <Link href="/cuerpo">Volver a Cuerpo</Link>
          </Button>
        </div>
      )}

      {error && <p className="text-center text-sm font-bold">{error}</p>}
    </div>
  );
}
