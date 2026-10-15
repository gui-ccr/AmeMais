import { api } from "@/lib/axios";
import { formatPhone } from "@/utils";
import type { EditarVoluntarioInput, NovoVoluntarioInput, Voluntario, VoluntarioDTO } from "../types";

/** Do formato da API para o modelo usado nas telas. A API manda o telefone só com dígitos; a tela recebe com máscara. */
export function paraVoluntario(dto: VoluntarioDTO): Voluntario {
  return {
    id: dto.id,
    nome: dto.nome,
    email: dto.email ?? "",
    telefone: formatPhone(dto.telefone),
    tipo: dto.tipo,
    status: dto.status,
    bairro: dto.bairro ?? "",
    areasDeAjuda: [...dto.areasDeAjuda],
    createdAt: dto.createdAt,
  };
}

/**
 * Chamadas à API de voluntários (`/api/voluntarios`). O formato de resposta é o de
 * apps/api/src/features/voluntarios/voluntario.dto.ts; o corpo do cadastro segue o
 * `createVoluntarioSchema` de lá (telefone só com dígitos e sem `status`: todo
 * voluntário nasce "ativo").
 *
 * ATENÇÃO — DEPENDE DO BACK: as rotas chegam com o PR #74 (`feat/listar-voluntarios`);
 * antes dele entrar na main, estas chamadas voltam 404. O `PUT` do #74 exige o corpo
 * completo (`email`, `bairro` e `areasDeAjuda` sempre presentes, `null` quando vazios),
 * que é o que `paraDadosDoVoluntario` já monta. E-mail repetido volta 409 com
 * `{ error }` — nas telas, mostre com `mensagemDeErroDaApi`.
 */

/** O maior `limit` que o back aceita em `GET /api/voluntarios`. */
const LIMITE_POR_PAGINA = 100;
/** Trava contra laço infinito se o back um dia ignorar `page` (100 × 50 = 5 000 voluntários). */
const MAXIMO_DE_PAGINAS = 50;

export const voluntarioService = {
  /**
   * Todos os voluntários, em ordem de nome. A API é paginada (20 por página se nada for
   * pedido) e o total vem no cabeçalho `X-Total-Count`, que o navegador não consegue ler
   * (a API não o libera no CORS). Por isso busca de 100 em 100 até vir uma página incompleta.
   */
  async list(): Promise<Voluntario[]> {
    const todos: VoluntarioDTO[] = [];
    for (let page = 1; page <= MAXIMO_DE_PAGINAS; page++) {
      const { data } = await api.get<{ data: VoluntarioDTO[] }>("/api/voluntarios", {
        params: { page, limit: LIMITE_POR_PAGINA },
      });
      todos.push(...data.data);
      if (data.data.length < LIMITE_POR_PAGINA) break;
    }
    return todos.map(paraVoluntario);
  },

  async get(id: string): Promise<Voluntario> {
    const { data } = await api.get<{ data: VoluntarioDTO }>(`/api/voluntarios/${id}`);
    return paraVoluntario(data.data);
  },

  async create(input: NovoVoluntarioInput): Promise<Voluntario> {
    const { data } = await api.post<{ data: VoluntarioDTO }>("/api/voluntarios", input);
    return paraVoluntario(data.data);
  },

  /** Edita os dados do voluntário. O status não muda por aqui: ele tem operação própria. */
  async update(id: string, input: EditarVoluntarioInput): Promise<Voluntario> {
    const { data } = await api.put<{ data: VoluntarioDTO }>(`/api/voluntarios/${id}`, input);
    return paraVoluntario(data.data);
  },
};
