import type { Metadata } from "next";
import Link from "next/link";
import { PawTrailBackground } from "@/components/ui/paw-trail-background";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-brand-cream p-8 text-center">
      <PawTrailBackground />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <span className="font-display text-8xl font-bold text-primary md:text-9xl">404</span>
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Página não encontrada</h1>
        <p className="max-w-md text-xl leading-snug text-muted-dark">
          Ops! Não encontramos o que você procurava. Talvez algum cãozinho tenha levado essa página embora 🐾
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-primary px-7 py-3 text-lg font-medium text-white no-underline transition-colors hover:bg-primary-hover hover:text-white"
        >
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
