import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../src/core/errors";
import type { IContasGateway } from "../src/features/equipe/contas.gateway";
import type { MembroDTO } from "../src/features/equipe/equipe.dto";
import { traduzirErroDaRpc, type IEquipeRepository } from "../src/features/equipe/equipe.repository";
import { SalvarMatrizUseCase } from "../src/features/equipe/use-cases/departamentos.use-cases";
import {
  CreateMembroUseCase,
  RedefinirSenhaDoMembroUseCase,
  UpdateStatusDoMembroUseCase,
} from "../src/features/equipe/use-cases/membros.use-cases";

const ID = "3f2b8c1e-5d4a-4b7e-9c1d-0a1b2c3d4e5f";
const DEP = "7a9d6e2c-1b3f-4c8a-8d5e-9f0a1b2c3d4e";

function membro(id: string): MembroDTO {
  return { id, nome: "Ana", email: "ana@x.com", ativo: true, ultimoAcesso: null, departamentos: [] };
}

function repositorioFalso(sobrescrever: Partial<IEquipeRepository> = {}): IEquipeRepository {
  return {
    temAcessoAdminTotal: vi.fn(async () => true),
    autorizar: vi.fn(async () => undefined),
    autorizarAcaoSobreConta: vi.fn(async () => undefined),
    listarMembros: vi.fn(async () => [membro(ID)]),
    listarDepartamentos: vi.fn(async () => ({ modulos: [], departamentos: [] })),
    definirDepartamentosDoMembro: vi.fn(async () => undefined),
    criarDepartamento: vi.fn(async () => DEP),
    atualizarDepartamento: vi.fn(async () => undefined),
    salvarMatriz: vi.fn(async () => undefined),
    removerDepartamento: vi.fn(async () => undefined),
    ...sobrescrever,
  };
}

function contasFalsas(sobrescrever: Partial<IContasGateway> = {}): IContasGateway {
  return {
    criarConta: vi.fn(async () => ({ id: ID })),
    apagarConta: vi.fn(async () => undefined),
    definirAtivo: vi.fn(async () => undefined),
    definirSenhaProvisoria: vi.fn(async () => undefined),
    trocarMinhaSenha: vi.fn(async () => undefined),
    ...sobrescrever,
  };
}

describe("CreateMembroUseCase", () => {
  it("autoriza antes de criar a conta, usa a senha gerada e a devolve junto com o membro", async () => {
    const repo = repositorioFalso();
    const contas = contasFalsas();
    const r = await new CreateMembroUseCase(repo, contas, () => "Senha-Gerada-123").execute({
      nome: "Ana",
      email: "ana@x.com",
      departamentoIds: [DEP],
    });

    expect(r).toEqual({ membro: membro(ID), senhaProvisoria: "Senha-Gerada-123" });
    expect(contas.criarConta).toHaveBeenCalledWith({ nome: "Ana", email: "ana@x.com", senha: "Senha-Gerada-123" });
    expect(repo.definirDepartamentosDoMembro).toHaveBeenCalledWith(ID, [DEP]);
  });

  it("sem acesso admin não cria conta nenhuma", async () => {
    const repo = repositorioFalso({ autorizar: vi.fn(async () => Promise.reject(new ForbiddenError())) });
    const contas = contasFalsas();

    await expect(
      new CreateMembroUseCase(repo, contas).execute({ nome: "Ana", email: "ana@x.com", departamentoIds: [] }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(contas.criarConta).not.toHaveBeenCalled();
  });

  it("sem departamentos informados mantém o de padrão do gatilho (não chama a troca)", async () => {
    const repo = repositorioFalso();
    await new CreateMembroUseCase(repo, contasFalsas()).execute({ nome: "Ana", email: "ana@x.com", departamentoIds: [] });
    expect(repo.definirDepartamentosDoMembro).not.toHaveBeenCalled();
  });

  it("se a troca de departamentos falhar, desfaz a conta recém-criada e repassa o erro", async () => {
    const repo = repositorioFalso({
      definirDepartamentosDoMembro: vi.fn(async () => Promise.reject(new ValidationError("Algum departamento informado não existe"))),
    });
    const contas = contasFalsas();

    await expect(
      new CreateMembroUseCase(repo, contas).execute({ nome: "Ana", email: "ana@x.com", departamentoIds: [DEP] }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(contas.apagarConta).toHaveBeenCalledWith(ID);
  });

  it("e-mail repetido (409 do Auth) não tenta configurar nada", async () => {
    const repo = repositorioFalso();
    const contas = contasFalsas({ criarConta: vi.fn(async () => Promise.reject(new ConflictError("Já existe uma conta com este e-mail"))) });

    await expect(
      new CreateMembroUseCase(repo, contas).execute({ nome: "Ana", email: "ana@x.com", departamentoIds: [DEP] }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repo.definirDepartamentosDoMembro).not.toHaveBeenCalled();
  });
});

describe("UpdateStatusDoMembroUseCase", () => {
  it("desativar: o banco autoriza ('desativar') antes do ban no Auth", async () => {
    const ordem: string[] = [];
    const repo = repositorioFalso({ autorizarAcaoSobreConta: vi.fn(async () => void ordem.push("autoriza")) });
    const contas = contasFalsas({ definirAtivo: vi.fn(async () => void ordem.push("ban")) });

    await new UpdateStatusDoMembroUseCase(repo, contas).execute(ID, false);

    expect(repo.autorizarAcaoSobreConta).toHaveBeenCalledWith(ID, "desativar");
    expect(contas.definirAtivo).toHaveBeenCalledWith(ID, false);
    expect(ordem).toEqual(["autoriza", "ban"]);
  });

  it("anti-trava (409 do banco): não chega a banir", async () => {
    const repo = repositorioFalso({
      autorizarAcaoSobreConta: vi.fn(async () => Promise.reject(new ConflictError("Você não pode desativar o seu próprio acesso"))),
    });
    const contas = contasFalsas();

    await expect(new UpdateStatusDoMembroUseCase(repo, contas).execute(ID, false)).rejects.toBeInstanceOf(ConflictError);
    expect(contas.definirAtivo).not.toHaveBeenCalled();
  });

  it("reativar usa a ação 'ativar'", async () => {
    const repo = repositorioFalso();
    await new UpdateStatusDoMembroUseCase(repo, contasFalsas()).execute(ID, true);
    expect(repo.autorizarAcaoSobreConta).toHaveBeenCalledWith(ID, "ativar");
  });
});

describe("RedefinirSenhaDoMembroUseCase", () => {
  it("define a senha gerada na conta e a devolve", async () => {
    const contas = contasFalsas();
    const r = await new RedefinirSenhaDoMembroUseCase(repositorioFalso(), contas, () => "Nova-Senha-456").execute(ID);

    expect(r).toEqual({ senhaProvisoria: "Nova-Senha-456" });
    expect(contas.definirSenhaProvisoria).toHaveBeenCalledWith(ID, "Nova-Senha-456");
  });

  it("recusado pelo banco (ex.: a própria conta): não mexe no Auth", async () => {
    const repo = repositorioFalso({ autorizarAcaoSobreConta: vi.fn(async () => Promise.reject(new ConflictError("própria senha"))) });
    const contas = contasFalsas();

    await expect(new RedefinirSenhaDoMembroUseCase(repo, contas).execute(ID)).rejects.toBeInstanceOf(ConflictError);
    expect(contas.definirSenhaProvisoria).not.toHaveBeenCalled();
  });
});

describe("SalvarMatrizUseCase", () => {
  it("repassa a matriz e devolve o departamento atualizado", async () => {
    const atualizado = { id: DEP, nome: "TI", descricao: null, totalMembros: 1, permissoes: [] };
    const repo = repositorioFalso({
      listarDepartamentos: vi.fn(async () => ({ modulos: [], departamentos: [atualizado] })),
    });

    const r = await new SalvarMatrizUseCase(repo).execute(DEP, { permissoes: [{ moduloId: ID, nivel: "leitura" }] });

    expect(repo.salvarMatriz).toHaveBeenCalledWith(DEP, [{ moduloId: ID, nivel: "leitura" }]);
    expect(r).toBe(atualizado);
  });
});

describe("traduzirErroDaRpc", () => {
  it("mapeia os códigos da migration para os erros HTTP certos", () => {
    expect(traduzirErroDaRpc({ code: "42501", message: "x" })).toBeInstanceOf(ForbiddenError);
    expect(traduzirErroDaRpc({ code: "EQ400", message: "x" })).toBeInstanceOf(ValidationError);
    const conflito = traduzirErroDaRpc({ code: "EQ409", message: "Este é o último administrador ativo" });
    expect(conflito).toBeInstanceOf(ConflictError);
    expect(conflito.message).toBe("Este é o último administrador ativo");
    const naoEncontrado = traduzirErroDaRpc({ code: "P0002", message: "Membro não encontrado" });
    expect(naoEncontrado).toBeInstanceOf(NotFoundError);
    expect(naoEncontrado.message).toBe("Membro não encontrado");
  });

  it("erro desconhecido vira 500 genérico, sem vazar a mensagem do banco", () => {
    const erro = traduzirErroDaRpc({ code: "XX000", message: "relation foo does not exist" });
    expect((erro as { statusCode?: number }).statusCode).toBe(500);
    expect(erro.message).toBe("Erro ao acessar o banco de dados");
  });
});
