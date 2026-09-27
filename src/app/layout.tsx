import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "TreinaReport AI - Gestão de Treinamento",
  description: "Acompanhamento diário de turmas, sistemas, absenteísmo, desempenho individual e geração inteligente de e-mails com IA no padrão Bradesco.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TreinaReport AI",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#cc092f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* PWA / iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TreinaReport AI" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-dark-bg text-dark-text antialiased">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
        <Analytics />
      </body>
    </html>
  );
}
