import { api } from "@/lib/axios";
import { formatPhone } from "@/utils";
import type {
  EditarVoluntarioInput,
  NovoVoluntarioInput,
  StatusVoluntario,
  Voluntario,
  VoluntarioDetalhe,
  VoluntarioDetalheDTO,
  VoluntarioDTO,
} from "../types";

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

export function paraVoluntarioDetalhe(dto: VoluntarioDetalheDTO): VoluntarioDetalhe {
  const lar = dto.larTemporario;
  return {
    ...paraVoluntario(dto),
    larTemporario: lar ? { id: lar.id, enderecoRegiao: lar.enderecoRegiao ?? "" } : null,
  };
}

/**
 * Chamadas à API de voluntários (`/api/voluntarios`). O formato de resposta é o de
 * apps/api/src/features/voluntarios/voluntario.dto.ts; o corpo do cadastro segue o
 * `createVoluntarioSchema` de lá (telefone só com dígitos e sem `status`: todo
 * voluntário nasce "ativo").
 *
 * As rotas vêm do PR #74 (`feat/listar-voluntarios`, já na main). O `PUT` exige o corpo
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
   * Todos os voluntários, em ordem de nome, cada um com o lar temporário dele. A API é
   * paginada (20 por página se nada for pedido) e manda o total no cabeçalho
   * `X-Total-Count` (liberado no CORS): busca de 100 em 100 até ter todos ou vir uma
   * página incompleta.
   */
  async list(): Promise<VoluntarioDetalhe[]> {
    const todos: VoluntarioDetalheDTO[] = [];
    for (let page = 1; page <= MAXIMO_DE_PAGINAS; page++) {
      const { data, headers } = await api.get<{ data: VoluntarioDetalheDTO[] }>("/api/voluntarios", {
        params: { page, limit: LIMITE_POR_PAGINA },
      });
      todos.push(...data.data);
      const total = Number(headers["x-total-count"]);
      if (data.data.length < LIMITE_POR_PAGINA || todos.length >= total) break;
    }
    return todos.map(paraVoluntarioDetalhe);
  },

  /**
   * Voluntários que podem ser responsáveis por um lar: ativos e com "Lar temporário" nas áreas
   * de ajuda (filtros `status` e `area` da API). `busca` procura por nome, e-mail ou telefone.
   * Devolve só os primeiros `limit` — a tela refina digitando.
   */
  async buscarParaLarTemporario(busca: string, limit = 10): Promise<Voluntario[]> {
    const { data } = await api.get<{ data: VoluntarioDTO[] }>("/api/voluntarios", {
      params: { status: "ativo", area: "lar_temporario", busca: busca.trim() || undefined, limit },
    });
    return data.data.map(paraVoluntario);
  },

  /** Um voluntário com o lar temporário dele. */
  async get(id: string): Promise<VoluntarioDetalhe> {
    const { data } = await api.get<{ data: VoluntarioDetalheDTO }>(`/api/voluntarios/${id}`);
    return paraVoluntarioDetalhe(data.data);
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

  /** Ativa ou inativa. Não mexe no lar vinculado. */
  async updateStatus(id: string, status: StatusVoluntario): Promise<Voluntario> {
    const { data } = await api.patch<{ data: VoluntarioDTO }>(`/api/voluntarios/${id}/status`, { status });
    return paraVoluntario(data.data);
  },

  /** Remove o voluntário. A API responde 409 se ele tem lar vinculado (nesse caso, inative). */
  async remove(id: string): Promise<void> {
    await api.delete(`/api/voluntarios/${id}`);
  },
};
