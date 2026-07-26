import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduLab AI — La classe numérique qui aide à comprendre",
  description:
    "Plateforme éducative pour les élèves ivoiriens du secondaire : professeur IA, cours structurés, laboratoire virtuel et préparation au BEPC et au BAC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[var(--bg)] text-night-900 antialiased">
        {children}
      </body>
    </html>
  );
}
