import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchadensMelder - Hausverwaltungs-Portal",
  description: "Digitale Schadensmeldung und Case-Management für Hausverwaltungen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
