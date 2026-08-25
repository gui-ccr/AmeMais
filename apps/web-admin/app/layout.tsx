import type { Metadata } from "next";
import { Caveat, Patrick_Hand } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
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
  title: "AmeMais Admin",
  description: "Painel administrativo AmeMais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${caveat.variable} ${patrickHand.variable}`}>
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

