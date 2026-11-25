import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Versión desplegada ahora (la app abierta la compara con la suya). */
export function GET() {
  return NextResponse.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
