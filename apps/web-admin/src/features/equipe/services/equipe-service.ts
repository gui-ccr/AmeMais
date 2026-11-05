import { api } from "@/lib/axios";
import type {
  Departamento,
  DepartamentoInput,
  DepartamentosEModulos,
  Membro,
  MembroComSenhaProvisoria,
  NovoMembroInput,
  Permissao,
} from "../types";

/**
 * Chamadas à API de equipe (`/api/equipe/*`). Todas exigem admin/total: sem isso a API
 * responde 403 (e a tela mostra "Você não tem acesso a esta área"). Regras anti-trava voltam
 * como 409 com `{ error }` — nas telas, mostre com `mensagemDeErroDaApi`.
 */
export const equipeService = {
  async listMembros(busca?: string): Promise<Membro[]> {
    const { data } = await api.get<{ data: Membro[] }>("/api/equipe/membros", {
      params: busca?.trim() ? { busca: busca.trim() } : undefined,
    });
    return data.data;
  },

  async createMembro(input: NovoMembroInput): Promise<MembroComSenhaProvisoria> {
    const { data } = await api.post<{ data: MembroComSenhaProvisoria }>("/api/equipe/membros", input);
    return data.data;
  },

  async updateDepartamentosDoMembro(id: string, departamentoIds: string[]): Promise<void> {
    await api.put(`/api/equipe/membros/${id}/departamentos`, { departamentoIds });
  },

  async updateAtivo(id: string, ativo: boolean): Promise<void> {
    await api.patch(`/api/equipe/membros/${id}/status`, { ativo });
  },

  /** Gera nova senha provisória; ela só existe nesta resposta. */
  async gerarSenhaProvisoria(id: string): Promise<string> {
    const { data } = await api.post<{ data: { senhaProvisoria: string } }>(`/api/equipe/membros/${id}/senha-provisoria`);
    return data.data.senhaProvisoria;
  },

  async listDepartamentos(): Promise<DepartamentosEModulos> {
    const { data } = await api.get<{ data: DepartamentosEModulos }>("/api/equipe/departamentos");
    return data.data;
  },

  async createDepartamento(input: DepartamentoInput): Promise<Departamento> {
    const { data } = await api.post<{ data: Departamento }>("/api/equipe/departamentos", input);
    return data.data;
  },

  async updateDepartamento(id: string, input: DepartamentoInput): Promise<Departamento> {
    const { data } = await api.put<{ data: Departamento }>(`/api/equipe/departamentos/${id}`, input);
    return data.data;
  },

  async salvarMatriz(id: string, permissoes: Permissao[]): Promise<Departamento> {
    const { data } = await api.put<{ data: Departamento }>(`/api/equipe/departamentos/${id}/permissoes`, { permissoes });
    return data.data;
  },

  async removeDepartamento(id: string): Promise<void> {
    await api.delete(`/api/equipe/departamentos/${id}`);
  },

  /** A própria pessoa troca a senha (sai do modo "senha provisória"). */
  async trocarMinhaSenha(senha: string): Promise<void> {
    await api.put("/api/auth/senha", { senha });
  },
};
