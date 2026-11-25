import type { NextConfig } from "next";

// Versión de esta compilación (el commit en Vercel). La app la compara con /api/version
// para avisar cuando hay una nueva y ofrecer actualizar.
const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? `local-${Date.now()}`;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION },
  experimental: {
    // Volver a una pestaña vista hace menos de 30 s es instantáneo.
    // Las acciones (revalidatePath) limpian esta memoria, así que no muestra datos viejos.
    staleTimes: { dynamic: 30, static: 300 },
  },
};

export default nextConfig;
