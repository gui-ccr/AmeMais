import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-foreground">AmeMais Admin</h1>
      <p className="text-sm text-muted-foreground">Painel administrativo — em construção.</p>
      <Link href="/login">
        <Button>Entrar</Button>
      </Link>
    </main>
  );
}
