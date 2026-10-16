import { api } from "@/lib/axios";
import type { EditarLarInput, Lar, NovoLarInput, ShelterDTO, StatusLar } from "../types";

/** Do formato da API para o modelo usado nas telas. */
export function paraLar(dto: ShelterDTO): Lar {
  return {
    id: dto.id,
    nomeResponsavel: dto.nomeResponsavel,
    contato: dto.contato,
    capacidade: dto.capacidade,
    status: dto.status,
    enderecoRegiao: dto.enderecoRegiao ?? "",
    ativo: dto.isActive,
    createdAt: dto.createdAt,
  };
}

/**
 * Chamadas à API de lares temporários (`/api/lares`). O que a API já tem: listar,
 * buscar um, cadastrar, trocar o status e excluir.
 */
export const larService = {
  async list(): Promise<Lar[]> {
    // A API pagina por padrão (limit 20, máx. 100). Pedimos o máximo para a lista não vir
    // truncada em silêncio; paginação de verdade no front fica para a tarefa LAR-FE-2.
    const { data } = await api.get<{ data: ShelterDTO[] }>("/api/lares", { params: { limit: 100 } });
    return data.data.map(paraLar);
  },

  async get(id: string): Promise<Lar> {
    const { data } = await api.get<{ data: ShelterDTO }>(`/api/lares/${id}`);
    return paraLar(data.data);
  },

  /** Cadastra um lar. A API cria sempre como "disponível": por isso o corpo não leva `status`. */
  async create(input: NovoLarInput): Promise<Lar> {
    const { data } = await api.post<{ data: ShelterDTO }>("/api/lares", input);
    return paraLar(data.data);
  },

  /**
   * Edita os dados do lar (nome, contato, capacidade e endereço).
   *
   * ATENÇÃO — DEPENDE DO BACK: esta rota ainda NÃO existe. Hoje `/api/lares/:id` só tem
   * `PATCH` para trocar o status (exige `status` no corpo), então esta chamada volta
   * erro 400/405 até o back criar a edição. Contrato proposto: `PUT /api/lares/:id` com
   * os 4 campos de `EditarLarInput`, devolvendo o lar atualizado como as outras rotas
   * (`{ data: ShelterDTO }`); o status não muda por aqui. Se o back escolher outro
   * formato, é só ajustar esta função.
   */
  async update(id: string, input: EditarLarInput): Promise<Lar> {
    const { data } = await api.put<{ data: ShelterDTO }>(`/api/lares/${id}`, input);
    return paraLar(data.data);
  },

  /** Troca o status (`PATCH`). A API só aceita o próximo status do ciclo — ver `TRANSICOES_STATUS_LAR`. */
  async updateStatus(id: string, status: StatusLar): Promise<Lar> {
    const { data } = await api.patch<{ data: ShelterDTO }>(`/api/lares/${id}`, { status });
    return paraLar(data.data);
  },
};
