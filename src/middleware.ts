import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Corre en Node, en la misma región que las funciones (pdx1), al lado de Supabase.
  runtime: "nodejs",
  matcher: [
    // Todo menos estáticos, íconos y archivos de la PWA.
    "/((?!_next/static|_next/image|icon.svg|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
