"use client";

import { usePermissoes } from "../hooks/use-permissoes";
import type { Modulo } from "../services/permissoes-service";

/** Renderiza os filhos (botões de criar/editar/excluir) só para quem tem acesso total ao módulo. */
export function SomenteEscrita({ modulo, children }: { modulo: Modulo; children: React.ReactNode }) {
  const { podeEditar } = usePermissoes();
  return podeEditar(modulo) ? <>{children}</> : null;
}
