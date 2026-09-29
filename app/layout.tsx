import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR dinámicos",
  description: "Sistema de QR dinámicos para negocios locales",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}