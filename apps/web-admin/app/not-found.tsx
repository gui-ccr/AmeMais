import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      <span className="text-7xl font-semibold text-primary">404</span>
      <h1 className="text-3xl font-semibold text-foreground">Página não encontrada</h1>
      <p className="max-w-xs text-md text-muted-foreground">
        Essa rota não existe no painel administrativo. Verifique o endereço ou volte para o painel.
      </p>
      <Link
        href="/"
        className="mt-1 rounded-md border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
      >
        Voltar ao painel
      </Link>
    </main>
  );
}
