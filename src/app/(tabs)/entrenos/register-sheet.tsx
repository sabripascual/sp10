"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const types = ["Fútbol", "Fuerza", "Correr", "Pádel", "Otro"];

// Demo del bottom sheet: todavía no guarda (Etapa 3).
export function RegisterSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="w-full">
          Registrar entreno
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>¿Qué hiciste hoy?</SheetTitle>
        <SheetDescription className="mb-5">Un toque y listo.</SheetDescription>
        <div className="grid grid-cols-2 gap-3">
          {types.map((t) => (
            <SheetClose asChild key={t}>
              <Button size="lg" className="bg-bg">{t}</Button>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
