import type { IContasGateway } from "../contas.gateway";
import { gerarSenhaProvisoria } from "../domain/senha-provisoria";
import type { MembroComSenhaProvisoriaDTO, MembroDTO, SenhaProvisoriaDTO } from "../equipe.dto";
import type { IEquipeRepository } from "../equipe.repository";
import type { CreateMembroDTO } from "../schema";
import { InternalError } from "@/core/errors";

export class ListMembrosUseCase {
  constructor(private readonly repository: IEquipeRepository) {}

  execute(busca?: string): Promise<MembroDTO[]> {
    return this.repository.listarMembros(busca);
  }
}

/**
 * Cria a conta no Auth com senha provisória (o gatilho do banco cria a linha em `usuarios` e põe
 * a pessoa em "Voluntariado") e, se foram escolhidos departamentos, troca o de padrão por eles.
 * Se essa segunda etapa falhar, a conta recém-criada é desfeita para não sobrar um usuário
 * "meio configurado" — e como a senha nunca foi entregue, nada se perde.
 */
export class CreateMembroUseCase {
  constructor(
    private readonly repository: IEquipeRepository,
    private readonly contas: IContasGateway,
    private readonly gerarSenha: () => string = gerarSenhaProvisoria,
  ) {}

  async execute({ nome, email, departamentoIds }: CreateMembroDTO): Promise<MembroComSenhaProvisoriaDTO> {
    await this.repository.autorizar();

    const senhaProvisoria = this.gerarSenha();
    const conta = await this.contas.criarConta({ nome, email, senha: senhaProvisoria });

    try {
      if (departamentoIds.length > 0) {
        await this.repository.definirDepartamentosDoMembro(conta.id, departamentoIds);
      }
      const [membro] = (await this.repository.listarMembros(email)).filter((item) => item.id === conta.id);
      if (!membro) throw new InternalError(new Error("Membro recém-criado não apareceu na listagem"));
      return { membro, senhaProvisoria };
    } catch (erro) {
      await this.contas.apagarConta(conta.id).catch(() => undefined);
      throw erro;
    }
  }
}

export class UpdateDepartamentosDoMembroUseCase {
  constructor(private readonly repository: IEquipeRepository) {}

  async execute(membroId: string, departamentoIds: string[]): Promise<void> {
    await this.repository.definirDepartamentosDoMembro(membroId, departamentoIds);
  }
}

/**
 * Desativa (ban no Auth) ou reativa. As regras anti-trava (não desativar a si mesmo, não
 * desativar o último administrador ativo) são conferidas no banco ANTES de tocar no Auth.
 */
export class UpdateStatusDoMembroUseCase {
  constructor(
    private readonly repository: IEquipeRepository,
    private readonly contas: IContasGateway,
  ) {}

  async execute(membroId: string, ativo: boolean): Promise<void> {
    await this.repository.autorizarAcaoSobreConta(membroId, ativo ? "ativar" : "desativar");
    await this.contas.definirAtivo(membroId, ativo);
  }
}

/** Nova senha provisória pelo admin: devolvida só na resposta, e a pessoa terá de trocá-la no próximo acesso. */
export class RedefinirSenhaDoMembroUseCase {
  constructor(
    private readonly repository: IEquipeRepository,
    private readonly contas: IContasGateway,
    private readonly gerarSenha: () => string = gerarSenhaProvisoria,
  ) {}

  async execute(membroId: string): Promise<SenhaProvisoriaDTO> {
    await this.repository.autorizarAcaoSobreConta(membroId, "redefinir_senha");

    const senhaProvisoria = this.gerarSenha();
    await this.contas.definirSenhaProvisoria(membroId, senhaProvisoria);
    return { senhaProvisoria };
  }
}

/** A própria pessoa troca a senha e a flag `trocar_senha` é limpa na mesma chamada (não dá para limpar sem trocar). */
export class TrocarMinhaSenhaUseCase {
  constructor(private readonly contas: IContasGateway) {}

  async execute(usuarioId: string, senha: string): Promise<void> {
    await this.contas.trocarMinhaSenha(usuarioId, senha);
  }
}
