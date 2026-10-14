import { AreaDeAjuda } from "./domain/area-de-ajuda.vo";
import { StatusVoluntario } from "./domain/status-voluntario.vo";
import { TipoVoluntario } from "./domain/tipo-voluntario.vo";
import { Voluntario, type VoluntarioCreationData } from "./domain/voluntario.entity";

/**
 * Formato exato da tabela "voluntarios" no Postgres (snake_case), conforme
 * a migration 20261006183000 (+ 20261010120000, que adicionou os NOT NULL).
 * Fica só aqui — nenhuma outra camada sabe como o banco nomeia suas colunas.
 *
 * `usuario_id` existe no banco (voluntário com login, fluxo antigo) mas não
 * faz parte do escopo do KAN-81 — só cadastro sem login. Não foi incluído aqui;
 * entra quando uma tarefa futura precisar dele.
 */
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

/**
 * Reconstrói a entidade de domínio a partir da linha crua do banco. É o
 * único ponto de tradução snake_case -> entidade.
 *
 * `telefone: null` vira `""` (nunca um número inventado) — é a única
 * divergência real entre o que o banco permite e o que o DTO promete,
 * documentada aqui porque não há como resolvê-la sem mudar a migration ou
 * o contrato do frontend, e os dois estão fora do escopo desta tarefa.
 */
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
