import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexoPay — Administration",
  description: "Plateforme d'automatisation Mobile Money marchand",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-brandBg text-brandBlack antialiased">{children}</body>
    </html>
  );
}
