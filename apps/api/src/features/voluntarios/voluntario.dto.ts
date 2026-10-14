import type { Voluntario } from "./domain/voluntario.entity";
import type { TipoVoluntarioValue } from "./domain/tipo-voluntario.vo";
import type { AreaDeAjudaValue } from "./domain/area-de-ajuda.vo";
import type { StatusVoluntarioValue } from "./domain/status-voluntario.vo";

/**
 * DTO de saída: o formato exato que a API devolve pro cliente — igual ao
 * contrato proposto pelo frontend (PR #67, `apps/web-admin/src/features/
 * voluntarios/opcoes.ts` e `types.ts`) mais o campo `status`, pedido pelo
 * KAN-81. `tipo`/`areasDeAjuda`/`status` aqui são os valores crus dos Value
 * Objects, nunca as instâncias — um DTO não vaza tipo de domínio.
 */
export interface VoluntarioDTO {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  tipo: TipoVoluntarioValue;
  status: StatusVoluntarioValue;
  bairro: string | null;
  areasDeAjuda: AreaDeAjudaValue[];
  createdAt: string;
}

export function toVoluntarioDTO(voluntario: Voluntario): VoluntarioDTO {
  return {
    id: voluntario.id,
    nome: voluntario.nome,
    email: voluntario.email,
    telefone: voluntario.telefone,
    tipo: voluntario.tipo.valor,
    status: voluntario.status.valor,
    bairro: voluntario.bairro,
    areasDeAjuda: voluntario.areasDeAjuda.map((area) => area.valor),
    createdAt: voluntario.createdAt,
  };
}
