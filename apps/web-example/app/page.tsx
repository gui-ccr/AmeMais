import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">AmeMais — app de exemplo</h1>
      <p className="max-w-sm text-center text-sm text-neutral-500">
        Este app não é um dos sites reais (esses são <code>apps/web-public</code> e{" "}
        <code>apps/web-admin</code>). Serve só de material de estudo do consumo do apps/api.
      </p>
      <Link
        href="/example-demo"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        Ver tela de exemplo (código de demonstração)
      </Link>
    </main>
  );
}
