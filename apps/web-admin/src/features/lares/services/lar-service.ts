import { api } from "@/lib/axios";
import type {
  AnimalElegivel,
  EditarLarInput,
  Lar,
  LarDetalhe,
  NovoLarInput,
  ShelterDTO,
  ShelterDetailDTO,
  StatusLar,
} from "../types";

/** Do formato da API para o modelo usado nas telas. */
export function paraLar(dto: ShelterDTO): Lar {
  return {
    id: dto.id,
    nomeResponsavel: dto.nomeResponsavel,
    contato: dto.contato,
    capacidade: dto.capacidade,
    ocupacao: dto.ocupacao ?? 0,
    vagas: dto.vagas ?? dto.capacidade,
    status: dto.status,
    enderecoRegiao: dto.enderecoRegiao ?? "",
    aceitaGatos: dto.aceitaGatos,
    aceitaCachorros: dto.aceitaCachorros,
    observacoes: dto.observacoes ?? "",
    voluntarioId: dto.voluntarioId ?? null,
    ativo: dto.isActive,
    createdAt: dto.createdAt,
  };
}

export function paraLarDetalhe(dto: ShelterDetailDTO): LarDetalhe {
  return {
    ...paraLar(dto),
    animais: dto.animais.map((animal) => ({
      id: animal.id,
      nome: animal.nome,
      especie: animal.especie ?? "",
      urlFoto: animal.urlFoto,
    })),
    voluntario: dto.voluntario ? { id: dto.voluntario.id, nome: dto.voluntario.nome } : null,
  };
}

/** O maior `limit` que o back aceita em `GET /api/lares`. */
const LIMITE_POR_PAGINA = 100;
/** Trava contra laço infinito se o back um dia ignorar `offset` (100 × 50 = 5 000 lares). */
const MAXIMO_DE_PAGINAS = 50;

/** Do que `GET /api/animals` devolve, só o que o vínculo precisa saber. */
interface AnimalDaListaDTO {
  id: string;
  nome: string;
  especie: string | null;
  status: string;
  urlFoto: string | null;
  larTemporarioId: string | null;
}

/**
 * Chamadas à API de lares temporários (`/api/lares`), formato de
 * apps/api/src/features/lares/shelter.dto.ts. As rotas de vincular/desvincular animal
 * devolvem o lar atualizado no formato do `GET /api/lares/:id`. Erros de regra voltam
 * `{ error }` (422 lar cheio/inativo/capacidade menor que a ocupação, 409 animal já em
 * outro lar): nas telas, mostre com `mensagemDeErroDaApi`.
 */
export const larService = {
  /**
   * Todos os lares, mais novos primeiro, cada um com ocupação e vagas. A API é paginada
   * (`limit` máx. 100, `offset`) e manda o total em `X-Total-Count`: busca de 100 em 100 até
   * ter todos. A busca e os filtros da tela rodam em cima desta lista.
   */
  async list(): Promise<Lar[]> {
    const todos: ShelterDTO[] = [];
    for (let pagina = 0; pagina < MAXIMO_DE_PAGINAS; pagina++) {
      const { data, headers } = await api.get<{ data: ShelterDTO[] }>("/api/lares", {
        params: { limit: LIMITE_POR_PAGINA, offset: pagina * LIMITE_POR_PAGINA },
      });
      todos.push(...data.data);
      const total = Number(headers["x-total-count"]);
      if (data.data.length < LIMITE_POR_PAGINA || todos.length >= total) break;
    }
    return todos.map(paraLar);
  },

  async get(id: string): Promise<LarDetalhe> {
    const { data } = await api.get<{ data: ShelterDetailDTO }>(`/api/lares/${id}`);
    return paraLarDetalhe(data.data);
  },

  /** Cadastra um lar. A API cria sempre como "disponível": por isso o corpo não leva `status`. */
  async create(input: NovoLarInput): Promise<Lar> {
    const { data } = await api.post<{ data: ShelterDTO }>("/api/lares", input);
    return paraLar(data.data);
  },

  /** Edita os dados do lar. Capacidade menor que a ocupação volta 422 com `{ error }`. */
  async update(id: string, input: EditarLarInput): Promise<Lar> {
    const { data } = await api.put<{ data: ShelterDTO }>(`/api/lares/${id}`, input);
    return paraLar(data.data);
  },

  /** Troca o status (`PATCH`). A API confere a matriz de transições — ver `TRANSICOES_STATUS_LAR`. */
  async updateStatus(id: string, status: StatusLar): Promise<Lar> {
    const { data } = await api.patch<{ data: ShelterDTO }>(`/api/lares/${id}`, { status });
    return paraLar(data.data);
  },

  /** Coloca o animal no lar. Devolve o lar atualizado (animais, ocupação e vagas). */
  async addAnimal(larId: string, animalId: string): Promise<LarDetalhe> {
    const { data } = await api.post<{ data: ShelterDetailDTO }>(`/api/lares/${larId}/animais`, { animalId });
    return paraLarDetalhe(data.data);
  },

  /** Tira o animal do lar (ele volta para "disponível"). Devolve o lar atualizado. */
  async removeAnimal(larId: string, animalId: string): Promise<LarDetalhe> {
    const { data } = await api.delete<{ data: ShelterDetailDTO }>(`/api/lares/${larId}/animais/${animalId}`);
    return paraLarDetalhe(data.data);
  },

  /**
   * Animais que podem ir para um lar: sem lar e ainda não adotados. `GET /api/animals` não
   * tem filtros, então o filtro é feito aqui, em cima da lista inteira.
   */
  async listAnimaisElegiveis(): Promise<AnimalElegivel[]> {
    const { data } = await api.get<{ data: AnimalDaListaDTO[] }>("/api/animals");
    return data.data
      .filter((animal) => animal.larTemporarioId === null && animal.status !== "adotado")
      .map((animal) => ({
        id: animal.id,
        nome: animal.nome,
        especie: animal.especie ?? "",
        urlFoto: animal.urlFoto,
      }));
  },
};
