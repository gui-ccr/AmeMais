import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      <span className="text-6xl font-semibold text-primary">404</span>
      <h1 className="text-4xl font-semibold text-foreground">Página não encontrada</h1>
      <p className="max-w-xs text-base text-muted-foreground">
        Essa rota não existe no painel administrativo. Verifique o endereço ou volte para o painel.
      </p>
      <Link href="/" className="mt-1">
        <Button variant="outline" size="sm">
          Voltar ao painel
        </Button>
      </Link>
    </main>
  );
}
