import Link from "next/link";
import { RecuperarSenhaForm } from "@/features/auth/components/recuperar-senha-form";

export default function RecuperarSenhaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">Painel AmeMais — recuperar senha</h1>
      <RecuperarSenhaForm />
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline">
          Voltar para o login
        </Link>
      </p>
    </main>
  );
}
