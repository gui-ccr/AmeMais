import { redirect } from "next/navigation";

/** Módulo ainda não existe e está fora do menu: quem chegar pela URL volta para o início. */
export default function InteressesPage() {
  redirect("/admin");
}
