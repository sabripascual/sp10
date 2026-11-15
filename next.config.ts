import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Volver a una pestaña vista hace menos de 30 s es instantáneo.
    // Las acciones (revalidatePath) limpian esta memoria, así que no muestra datos viejos.
    staleTimes: { dynamic: 30, static: 300 },
  },
};

export default nextConfig;
