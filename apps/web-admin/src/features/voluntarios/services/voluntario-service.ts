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
 * ATENÇÃO — DEPENDE DO BACK: o back já tem o DTO, o schema e o domínio, mas ainda
 * NÃO tem a rota (controller/use cases/`app/api/voluntarios`). Até ela existir,
 * estas chamadas voltam 404. A edição (`PUT`) com os mesmos campos do cadastro é o
 * contrato proposto pelo front — o back ainda não tem schema de edição.
 */
export const voluntarioService = {
  async list(): Promise<Voluntario[]> {
    const { data } = await api.get<{ data: VoluntarioDTO[] }>("/api/voluntarios");
    return data.data.map(paraVoluntario);
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
