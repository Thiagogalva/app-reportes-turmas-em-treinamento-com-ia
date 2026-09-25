import type { Metadata } from "next";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

export const metadata: Metadata = {
  title: "TreinaReport AI - Gestão de Treinamento",
  description: "Acompanhamento diário de turmas, sistemas, absenteísmo, desempenho individual e geração inteligente de e-mails com IA no padrão Bradesco.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-dark-bg text-dark-text antialiased">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
