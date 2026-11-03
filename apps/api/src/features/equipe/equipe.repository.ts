import type { SupabaseClient } from "@supabase/supabase-js";
import { ConflictError, DatabaseError, ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import type { DepartamentosEModulosDTO, MembroDTO } from "./equipe.dto";
import type { SalvarMatrizDTO } from "./schema";

export type AcaoSobreConta = "desativar" | "ativar" | "redefinir_senha";

/**
 * Tudo aqui passa pelas funções `equipe_*` do banco (migration 20261103120000), chamadas com o
 * client do PRÓPRIO usuário: cada função confere `check_user_access('admin','total')` e as regras
 * anti-trava dentro da mesma transação. Nenhum acesso direto às tabelas de RBAC.
 */
export interface IEquipeRepository {
  temAcessoAdminTotal(): Promise<boolean>;
  autorizar(): Promise<void>;
  autorizarAcaoSobreConta(usuarioId: string, acao: AcaoSobreConta): Promise<void>;
  listarMembros(busca?: string): Promise<MembroDTO[]>;
  listarDepartamentos(): Promise<DepartamentosEModulosDTO>;
  definirDepartamentosDoMembro(usuarioId: string, departamentoIds: string[]): Promise<void>;
  criarDepartamento(nome: string, descricao: string | null): Promise<string>;
  atualizarDepartamento(id: string, nome: string, descricao: string | null): Promise<void>;
  salvarMatriz(departamentoId: string, permissoes: SalvarMatrizDTO["permissoes"]): Promise<void>;
  removerDepartamento(id: string): Promise<void>;
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
}

/**
 * Traduz o erro de uma função `equipe_*`. As mensagens dos códigos 42501/P0002/EQ400/EQ409 são
 * escritas por nós na migration (texto seguro para o cliente); qualquer outro erro vira 500 genérico.
 */
export function traduzirErroDaRpc(error: PostgrestLikeError): Error {
  const mensagem = error.message ?? "";
  switch (error.code) {
    case "42501":
      return new ForbiddenError();
    case "P0002":
      return new NotFoundError(mensagem.replace(/ não encontrado$/, "") || "Recurso");
    case "EQ400":
      return new ValidationError(mensagem);
    case "EQ409":
      return new ConflictError(mensagem);
    default:
      return new DatabaseError(error);
  }
}

interface LinhaDeMembro {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  ultimo_acesso: string | null;
  departamentos: { id: string; nome: string }[];
}

export class EquipeRepository implements IEquipeRepository {
  constructor(private readonly db: SupabaseClient) {}

  private async chamar<T>(funcao: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.db.rpc(funcao, args);
    if (error) throw traduzirErroDaRpc(error);
    return data as T;
  }

  async temAcessoAdminTotal(): Promise<boolean> {
    const { data, error } = await this.db.rpc("check_user_access", { modulo_slug: "admin", nivel_minimo: "total" });
    if (error) throw new DatabaseError(error);
    return data === true;
  }

  async autorizar(): Promise<void> {
    await this.chamar("equipe_autorizar");
  }

  async autorizarAcaoSobreConta(usuarioId: string, acao: AcaoSobreConta): Promise<void> {
    await this.chamar("equipe_autorizar_acao_sobre_conta", { p_usuario_id: usuarioId, p_acao: acao });
  }

  async listarMembros(busca?: string): Promise<MembroDTO[]> {
    const linhas = await this.chamar<LinhaDeMembro[] | null>("equipe_listar_membros", { p_busca: busca ?? null });
    return (linhas ?? []).map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      email: linha.email,
      ativo: linha.ativo,
      ultimoAcesso: linha.ultimo_acesso,
      departamentos: linha.departamentos,
    }));
  }

  async listarDepartamentos(): Promise<DepartamentosEModulosDTO> {
    return this.chamar<DepartamentosEModulosDTO>("equipe_listar_departamentos");
  }

  async definirDepartamentosDoMembro(usuarioId: string, departamentoIds: string[]): Promise<void> {
    await this.chamar("equipe_definir_departamentos_do_membro", {
      p_usuario_id: usuarioId,
      p_departamento_ids: departamentoIds,
    });
  }

  async criarDepartamento(nome: string, descricao: string | null): Promise<string> {
    return this.chamar<string>("equipe_criar_departamento", { p_nome: nome, p_descricao: descricao });
  }

  async atualizarDepartamento(id: string, nome: string, descricao: string | null): Promise<void> {
    await this.chamar("equipe_atualizar_departamento", { p_id: id, p_nome: nome, p_descricao: descricao });
  }

  async salvarMatriz(departamentoId: string, permissoes: SalvarMatrizDTO["permissoes"]): Promise<void> {
    await this.chamar("equipe_salvar_matriz_do_departamento", {
      p_departamento_id: departamentoId,
      p_permissoes: permissoes,
    });
  }

  async removerDepartamento(id: string): Promise<void> {
    await this.chamar("equipe_remover_departamento", { p_id: id });
  }
}
