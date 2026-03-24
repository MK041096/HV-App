import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "SchadensMelder - Digitale Schadensmeldung für Hausverwaltungen",
  description: "Effiziente, mandantenfähige Plattform zur automatisierten Schadensabwicklung für Vermieter und Hausverwaltungen.",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "SchadensMelder",
    url: "https://zerodamage.de",
    title: "SchadensMelder - Digitale Schadensmeldung für Hausverwaltungen",
    description: "Effiziente, mandantenfähige Plattform zur automatisierten Schadensabwicklung.",
    images: [
      {
        url: "https://zerodamage.de/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  alternates: {
    canonical: "https://zerodamage.de/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SchadensMelder",
              url: "https://zerodamage.de",
              logo: "https://zerodamage.de/logo.png",
              sameAs: [
                "https://www.linkedin.com/company/zerodamage",
                "https://twitter.com/zerodamage"
              ]
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
