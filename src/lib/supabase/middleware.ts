import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

const PUBLIC_PATHS = ["/login", "/restringido"];

function redirectTo(request: NextRequest, pathname: string, base: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const res = NextResponse.redirect(url);
  // conservar las cookies de sesión refrescadas
  base.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // El cron se autentica con CRON_SECRET, no con sesión
  if (path.startsWith("/api/cron/") || path === "/api/version") return NextResponse.next();
  const isPublic = PUBLIC_PATHS.includes(path);

  if (!isSupabaseConfigured) {
    return isPublic ? NextResponse.next() : redirectTo(request, "/login", NextResponse.next());
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresca el token si hace falta (la sesión no se cae nunca) y verifica el JWT
  // localmente con las claves públicas del proyecto: sin ida y vuelta a Oregon.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user?.sub) {
    return isPublic ? response : redirectTo(request, "/login", response);
  }
  // Logueada: el login la manda a Hoy (a /restringido llega si su cuenta está pausada)
  if (path === "/login") {
    return redirectTo(request, "/", response);
  }
  return response;
}
