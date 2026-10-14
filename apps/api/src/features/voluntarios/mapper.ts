import { AreaDeAjuda } from "./domain/area-de-ajuda.vo";
import { StatusVoluntario } from "./domain/status-voluntario.vo";
import { TipoVoluntario } from "./domain/tipo-voluntario.vo";
import { Voluntario, type VoluntarioCreationData, type VoluntarioProps } from "./domain/voluntario.entity";


export interface VoluntarioRow {
  id: string;
  nome: string;
  email: string | null;
  // A coluna aceita NULL no banco (telefones legados inválidos foram
  // anulados pela própria migration 20261006183000), mas o contrato do DTO
  // (PR #67) exige `string` — ver mapRowToEntity.
  telefone: string | null;
  tipo: string;
  bairro: string | null;
  areas_de_ajuda: string[];
  status: string;
  created_at: string;
}


export function mapRowToEntity(row: VoluntarioRow): Voluntario {
  return Voluntario.restore({
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone ?? "",
    tipo: TipoVoluntario.from(row.tipo),
    bairro: row.bairro,
    areasDeAjuda: row.areas_de_ajuda.map((area) => AreaDeAjuda.from(area)),
    status: StatusVoluntario.from(row.status),
    createdAt: row.created_at,
  });
}

/** Recebe os dados já validados por `Voluntario.create()` — nunca o input cru da requisição. */
export function mapCreateDTOToRow(input: VoluntarioCreationData) {
  return {
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    tipo: input.tipo.valor,
    bairro: input.bairro,
    areas_de_ajuda: input.areasDeAjuda.map((area) => area.valor),
    status: input.status.valor,
  };
}


export function mapUpdateDTOToRow(voluntario: Pick<VoluntarioProps, "nome" | "email" | "telefone" | "tipo" | "bairro" | "areasDeAjuda">) {
  return {
    nome: voluntario.nome,
    email: voluntario.email,
    telefone: voluntario.telefone,
    tipo: voluntario.tipo.valor,
    bairro: voluntario.bairro,
    areas_de_ajuda: voluntario.areasDeAjuda.map((area) => area.valor),
  };
}
