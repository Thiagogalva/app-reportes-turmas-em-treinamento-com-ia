import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Visão Coordenadora — TreinaReport AI",
  description: "Painel somente leitura para coordenação de turmas em treinamento.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TreinaReport | Coord",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TreinaReport | Coord" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-dark-bg text-dark-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
