/**
 * Formatos de `/api/equipe/*` — espelham apps/api/src/features/equipe/equipe.dto.ts.
 * Sem camada de conversão: a API já devolve o que as telas usam.
 */
export type NivelDeAcesso = "total" | "leitura";

export interface DepartamentoResumo {
  id: string;
  nome: string;
}

export interface Membro {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  /** ISO 8601; `null` se a pessoa nunca entrou. */
  ultimoAcesso: string | null;
  departamentos: DepartamentoResumo[];
}

export interface Modulo {
  id: string;
  nome: string;
  slug: string;
}

export interface Permissao {
  moduloId: string;
  /** `null` = sem acesso ao módulo. */
  nivel: NivelDeAcesso | null;
}

export interface Departamento {
  id: string;
  nome: string;
  descricao: string | null;
  totalMembros: number;
  permissoes: Permissao[];
}

export interface DepartamentosEModulos {
  modulos: Modulo[];
  departamentos: Departamento[];
}

/** Resposta de criar membro: a senha provisória só vem aqui (e na de gerar nova senha). */
export interface MembroComSenhaProvisoria {
  membro: Membro;
  senhaProvisoria: string;
}

export interface NovoMembroInput {
  nome: string;
  email: string;
  departamentoIds: string[];
}

export interface DepartamentoInput {
  nome: string;
  descricao: string | null;
}
