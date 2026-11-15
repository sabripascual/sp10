import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  // Nunito es variable: sin "weight" baja un solo archivo con todos los pesos.
  display: "swap",
});

export const metadata: Metadata = {
  title: "SP10",
  description: "Tu coach de bolsillo: ayuno 16:8, fuerza y cuerpo.",
  appleWebApp: { capable: true, title: "SP10", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className="dark">
      <body className={`${nunito.variable} antialiased`}>{children}</body>
    </html>
  );
}
