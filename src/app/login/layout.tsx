import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Entrar — TreinaReport AI",
  description: "Acesso ao sistema TreinaReport AI.",
  manifest: "/manifest.webmanifest",
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

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-dark-bg text-dark-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
