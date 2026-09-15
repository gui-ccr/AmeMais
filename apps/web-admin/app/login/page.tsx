import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold">Painel AmeMais — login</h1>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        <Link href="/recuperar-senha" className="font-medium text-foreground underline">
          Esqueci minha senha
        </Link>
      </p>
    </main>
  );
}
