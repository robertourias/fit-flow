import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitFlow",
  description: "Acompanhamento e orientação de rotinas e estratégia de treino",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
