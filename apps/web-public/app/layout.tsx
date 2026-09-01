import type { Metadata } from "next";
import { Caveat, Patrick_Hand } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
  title: "AmeMais — Proteção Animal em Teófilo Otoni",
  description:
    "ONG de proteção animal que resgata, cuida e encontra famílias para cães e gatos abandonados em Teófilo Otoni, MG.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${caveat.variable} ${patrickHand.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
