"use client";

import { useTransition } from "react";
import { confirmPlanned } from "@/app/(tabs)/entrenos/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TYPE_EMOJI, TYPE_LABEL, type DayPlan } from "@/lib/training-types";
import { dayName } from "@/lib/week";

/** "¿Hubo fútbol?" para lo sugerido por la plantilla. Un toque confirma, otro marca "no fui". */
export function PlannedConfirm({ day }: { day: DayPlan }) {
  const [pending, start] = useTransition();
  if (!day.planned) return null;
  const type = day.planned;
  const when = day.isToday ? "hoy" : `el ${dayName(day.date)}`;

  return (
    <Card className="space-y-4">
      <CardTitle>
        {TYPE_EMOJI[type]} ¿Hubo {TYPE_LABEL[type].toLowerCase()} {when}?
      </CardTitle>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="primary" disabled={pending} onClick={() => start(async () => void (await confirmPlanned(day.date, type, true)))}>
          Fui
        </Button>
        <Button className="bg-bg" disabled={pending} onClick={() => start(async () => void (await confirmPlanned(day.date, type, false)))}>
          No fui
        </Button>
      </div>
    </Card>
  );
}
