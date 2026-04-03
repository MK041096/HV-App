import type { Metadata } from "next";
import { Inter, Playfair_Display, DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMARTCARL – Schadensmeldungen für Hausverwaltungen",
  description: "SMARTCARL digitalisiert Schadensmeldungen für Hausverwaltungen. Von der strukturierten Erfassung bis zur vollständigen Dokumentation.",
  verification: {
    google: "8kXnls5PFdXCfnnUloruvufIQNgCjfTFuHsqqLF6Rds",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "SMARTCARL",
    url: "https://smartcarl.com",
    title: "SMARTCARL - Digitale Schadensmeldung für Hausverwaltungen",
    description: "Effiziente, mandantenfähige Plattform zur automatisierten Schadensabwicklung.",
    images: [
      {
        url: "https://www.smartcarl.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SMARTCARL – Schadensmeldungen für Hausverwaltungen",
      },
    ],
  },
  alternates: {
    canonical: "https://smartcarl.com/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${playfair.variable} ${dmSerifDisplay.variable} ${dmSans.variable} antialiased`}>
        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SMARTCARL",
              url: "https://smartcarl.com",
              logo: "https://smartcarl.com/logo.png",
              sameAs: [
                "https://www.linkedin.com/company/smartcarl",
                "https://twitter.com/smartcarl"
              ]
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
