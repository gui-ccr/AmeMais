import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf6ef] p-8 text-center">
      <span className="text-6xl font-bold text-[#b4543f]">404</span>
      <h1 className="text-2xl font-semibold text-neutral-800">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-neutral-600">
        Ops! Não encontramos o que você procurava. Talvez algum cãozinho tenha levado essa página embora 🐾
       </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-[#b4543f] px-5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
