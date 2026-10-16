import type { Voluntario } from "./domain/voluntario.entity";
import type { TipoVoluntarioValue } from "./domain/tipo-voluntario.vo";
import type { AreaDeAjudaValue } from "./domain/area-de-ajuda.vo";
import type { StatusVoluntarioValue } from "./domain/status-voluntario.vo";


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


export interface LarVinculadoDTO {
  id: string;
  enderecoRegiao: string;
}


export interface VoluntarioDetalheDTO extends VoluntarioDTO {
  larTemporario: LarVinculadoDTO | null;
}

export function toVoluntarioDetalheDTO(voluntario: Voluntario, larTemporario: LarVinculadoDTO | null): VoluntarioDetalheDTO {
  return { ...toVoluntarioDTO(voluntario), larTemporario };
}
