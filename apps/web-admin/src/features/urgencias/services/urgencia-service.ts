import { api } from "@/lib/axios";
import type { Urgencia, UrgenciaFormValues, UrgencyDTO } from "../types";

/** Do formato da API (`metaArrecadacao`, `isActive`...) para o modelo usado nas telas. */
export function paraUrgencia(dto: UrgencyDTO): Urgencia {
  return {
    id: dto.id,
    titulo: dto.titulo,
    descricao: dto.descricao ?? "",
    prioridade: dto.prioridade,
    tipo: dto.tipo,
    dataLimite: dto.dataLimite,
    meta: dto.metaArrecadacao,
    unidade: dto.unidade,
    arrecadado: dto.valorArrecadado,
    ativo: dto.isActive,
    createdAt: dto.createdAt,
  };
}

/** Do modelo das telas para o corpo que a API espera em POST/PATCH `/api/urgencias`. */
function paraPayload(values: UrgenciaFormValues) {
  return {
    titulo: values.titulo,
    descricao: values.descricao,
    prioridade: values.prioridade,
    tipo: values.tipo,
    dataLimite: values.dataLimite,
    metaArrecadacao: values.meta,
    unidade: values.unidade,
    valorArrecadado: values.arrecadado,
    isActive: values.ativo,
  };
}

export const urgenciaService = {
  async list(): Promise<Urgencia[]> {
    const { data } = await api.get<{ data: UrgencyDTO[] }>("/api/urgencias");
    return data.data.map(paraUrgencia);
  },

  async create(input: UrgenciaFormValues): Promise<Urgencia> {
    const { data } = await api.post<{ data: UrgencyDTO }>("/api/urgencias", paraPayload(input));
    return paraUrgencia(data.data);
  },

  async update(id: string, input: UrgenciaFormValues): Promise<Urgencia> {
    const { data } = await api.patch<{ data: UrgencyDTO }>(`/api/urgencias/${id}`, paraPayload(input));
    return paraUrgencia(data.data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/urgencias/${id}`);
  },
};
