import type { Metadata } from "next";
import { Caveat, Patrick_Hand } from "next/font/google";
import { CursorPawTrail } from "@/components/ui/cursor-paw-trail";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_URL, SOCIAL } from "@/lib/site";
import { WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-patrick",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Proteção Animal em Teófilo Otoni`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "adoção de animais Teófilo Otoni",
    "ONG proteção animal MG",
    "adotar cachorro Teófilo Otoni",
    "adotar gato Teófilo Otoni",
    "doação PIX ONG animal",
    "lar temporário animais",
    "resgate de animais Teófilo Otoni",
  ],
  authors: [{ name: SITE_NAME }],
  applicationName: SITE_NAME,
  category: "Organização sem fins lucrativos",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/icon.jpg",
    apple: "/apple-icon.jpg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Proteção Animal em Teófilo Otoni`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Proteção Animal em Teófilo Otoni`,
    description: SITE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-amemais.jpg`,
  description: SITE_DESCRIPTION,
  foundingDate: "2019",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Teófilo Otoni",
    addressRegion: "MG",
    addressCountry: "BR",
  },
  sameAs: [SOCIAL.instagram],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: `+55${WHATSAPP_DISPLAY.replace(/\D/g, "")}`,
    email: SOCIAL.email,
    areaServed: "BR",
    availableLanguage: "Portuguese",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${caveat.variable} ${patrickHand.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <CursorPawTrail />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
