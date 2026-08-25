import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">AmeMais Admin</h1>
      <p className="text-sm text-neutral-500">Painel administrativo — em construção.</p>
      <Link
        href="/login"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        Entrar
      </Link>
    </main>
  );
}
