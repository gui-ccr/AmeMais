import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { UnauthorizedError } from "../src/core/errors";

const { mockRequireUser, repoMocks, gatewayMocks } = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
  repoMocks: {
    temAcessoAdminTotal: vi.fn(),
    autorizar: vi.fn(),
    autorizarAcaoSobreConta: vi.fn(),
    listarMembros: vi.fn(),
    listarDepartamentos: vi.fn(),
    definirDepartamentosDoMembro: vi.fn(),
    criarDepartamento: vi.fn(),
    atualizarDepartamento: vi.fn(),
    salvarMatriz: vi.fn(),
    removerDepartamento: vi.fn(),
  },
  gatewayMocks: {
    criarConta: vi.fn(),
    apagarConta: vi.fn(),
    definirAtivo: vi.fn(),
    definirSenhaProvisoria: vi.fn(),
    trocarMinhaSenha: vi.fn(),
  },
}));

vi.mock("@/middleware/auth", () => ({ requireUser: mockRequireUser }));
vi.mock("@/lib/supabase", () => ({ createSupabaseForUser: vi.fn(() => ({})), supabaseAdmin: {} }));
vi.mock("../src/features/equipe/equipe.repository", () => ({
  EquipeRepository: vi.fn().mockImplementation(function EquipeRepository() {
    return repoMocks;
  }),
}));
vi.mock("../src/features/equipe/contas.gateway", () => ({
  ContasGateway: vi.fn().mockImplementation(function ContasGateway() {
    return gatewayMocks;
  }),
}));

const { equipeController } = await import("../src/features/equipe/controller");

const ID = "3f2b8c1e-5d4a-4b7e-9c1d-0a1b2c3d4e5f";
const params = { params: Promise.resolve({ id: ID }) };

const requisicao = (corpo?: unknown) =>
  ({ nextUrl: new URL("http://localhost/api/equipe"), json: async () => corpo }) as unknown as NextRequest;

describe("EquipeController: porta de entrada admin/total", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "u1", email: "a@b.c", accessToken: "token" });
    repoMocks.temAcessoAdminTotal.mockResolvedValue(false);
  });

  const rotas: [string, () => Promise<Response>][] = [
    ["GET membros", () => equipeController.listMembros(requisicao())],
    ["POST membros", () => equipeController.createMembro(requisicao({ nome: "Ana", email: "a@b.com" }))],
    ["PUT departamentos do membro", () => equipeController.updateDepartamentosDoMembro(requisicao({ departamentoIds: [] }), params)],
    ["PATCH status", () => equipeController.updateStatusDoMembro(requisicao({ ativo: false }), params)],
    ["POST senha-provisoria", () => equipeController.redefinirSenhaDoMembro(requisicao(), params)],
    ["GET departamentos", () => equipeController.listDepartamentos(requisicao())],
    ["POST departamentos", () => equipeController.createDepartamento(requisicao({ nome: "Novo" }))],
    ["PUT departamento", () => equipeController.updateDepartamento(requisicao({ nome: "Novo", descricao: null }), params)],
    ["PUT permissoes", () => equipeController.salvarMatriz(requisicao({ permissoes: [] }), params)],
    ["DELETE departamento", () => equipeController.removeDepartamento(requisicao(), params)],
  ];

  it.each(rotas)("%s: sem admin/total responde 403 e não toca em nada (nem service role)", async (_nome, chamar) => {
    const resposta = await chamar();

    expect(resposta.status).toBe(403);
    for (const mock of [...Object.values(gatewayMocks), ...Object.values(repoMocks).filter((m) => m !== repoMocks.temAcessoAdminTotal)]) {
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it("sem token responde 401", async () => {
    mockRequireUser.mockRejectedValue(new UnauthorizedError("Token de autenticação ausente"));
    expect((await equipeController.listMembros(requisicao())).status).toBe(401);
    expect(repoMocks.temAcessoAdminTotal).not.toHaveBeenCalled();
  });

  it("corpo inválido responde 400 (id que não é uuid)", async () => {
    repoMocks.temAcessoAdminTotal.mockResolvedValue(true);
    const resposta = await equipeController.updateStatusDoMembro(requisicao({ ativo: false }), {
      params: Promise.resolve({ id: "nao-uuid" }),
    });
    expect(resposta.status).toBe(400);
  });

  it("criar membro devolve 201 com a senha provisória só nessa resposta", async () => {
    repoMocks.temAcessoAdminTotal.mockResolvedValue(true);
    repoMocks.autorizar.mockResolvedValue(undefined);
    gatewayMocks.criarConta.mockResolvedValue({ id: ID });
    repoMocks.listarMembros.mockResolvedValue([
      { id: ID, nome: "Ana", email: "ana@x.com", ativo: true, ultimoAcesso: null, departamentos: [] },
    ]);

    const resposta = await equipeController.createMembro(requisicao({ nome: "Ana", email: "ana@x.com" }));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(201);
    expect(corpo.data.membro.id).toBe(ID);
    expect(corpo.data.senhaProvisoria).toHaveLength(16);
    expect(gatewayMocks.criarConta).toHaveBeenCalledWith(expect.objectContaining({ senha: corpo.data.senhaProvisoria }));
  });

  it("listar membros não devolve campo de senha", async () => {
    repoMocks.temAcessoAdminTotal.mockResolvedValue(true);
    repoMocks.listarMembros.mockResolvedValue([]);
    const corpo = await (await equipeController.listMembros(requisicao())).json();
    expect(JSON.stringify(corpo)).not.toMatch(/senha/i);
  });

  it("trocar a própria senha não exige admin, mas exige login", async () => {
    gatewayMocks.trocarMinhaSenha.mockResolvedValue(undefined);
    const resposta = await equipeController.trocarMinhaSenha(requisicao({ senha: "umasenhaboa1" }));
    expect(resposta.status).toBe(200);
    expect(gatewayMocks.trocarMinhaSenha).toHaveBeenCalledWith("u1", "umasenhaboa1");
    expect(repoMocks.temAcessoAdminTotal).not.toHaveBeenCalled();
  });
});
