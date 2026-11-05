"use client";

import { useQuery } from "@tanstack/react-query";
import { type Modulo, permissoesService } from "../services/permissoes-service";
import { useSession } from "./use-session";

/**
 * Permissões da pessoa logada por módulo. Fonte única para a interface decidir o que mostrar:
 * `podeVer` (menu, acesso à tela) e `podeEditar` (botões de criar/editar/excluir/alterar status).
 * A barreira real continua sendo o RLS; isto só evita mostrar o que o servidor vai negar.
 *
 * Enquanto carrega (`carregando`), `podeVer`/`podeEditar` devolvem `false` — quem precisa
 * distinguir "ainda não sei" de "não pode" (ex.: o guard de rota) usa `carregando`.
 */
export function usePermissoes() {
  const { session, loading: sessaoCarregando } = useSession();

  const { data: permissoes, isLoading } = useQuery({
    queryKey: ["permissoes", session?.user.id],
    queryFn: permissoesService.buscarMinhas,
    enabled: !!session,
    staleTime: 5 * 60_000,
  });

  return {
    carregando: sessaoCarregando || (!!session && isLoading),
    podeVer: (modulo: Modulo) => !!permissoes?.[modulo],
    podeEditar: (modulo: Modulo) => permissoes?.[modulo] === "total",
  };
}
