export interface DepartamentoResumoDTO {
  id: string;
  nome: string;
}

export interface MembroDTO {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  /** ISO 8601; `null` se a pessoa nunca entrou. */
  ultimoAcesso: string | null;
  departamentos: DepartamentoResumoDTO[];
}

export interface ModuloDTO {
  id: string;
  nome: string;
  slug: string;
}

export interface PermissaoDTO {
  moduloId: string;
  /** `null` = sem acesso ao módulo. */
  nivel: "total" | "leitura" | null;
}

export interface DepartamentoDTO {
  id: string;
  nome: string;
  descricao: string | null;
  totalMembros: number;
  /** Uma entrada por módulo existente. */
  permissoes: PermissaoDTO[];
}

export interface DepartamentosEModulosDTO {
  modulos: ModuloDTO[];
  departamentos: DepartamentoDTO[];
}

/** Resposta de criar membro / gerar nova senha. A senha só existe nestas duas respostas. */
export interface MembroComSenhaProvisoriaDTO {
  membro: MembroDTO;
  senhaProvisoria: string;
}

export interface SenhaProvisoriaDTO {
  senhaProvisoria: string;
}
