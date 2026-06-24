import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Painel de Ensaios e Repertório",
  description: "Gerenciamento de ensaios e repertório musical",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
