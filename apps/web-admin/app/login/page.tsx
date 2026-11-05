import Link from "next/link";
import { TelaDeAcesso } from "@/components/layout/tela-de-acesso";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <TelaDeAcesso
      titulo="Bem-vindo de volta"
      descricao="Entre com sua conta para acessar o painel da AmeMais."
      rodape={
        <Link href="/recuperar-senha" className="font-semibold text-primary hover:text-primary-hover hover:underline">
          Esqueceu a senha?
        </Link>
      }
    >
      <LoginForm />
    </TelaDeAcesso>
  );
}
