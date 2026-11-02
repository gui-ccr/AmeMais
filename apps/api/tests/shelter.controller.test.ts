import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { UnauthorizedError } from "../src/core/errors";
import { Shelter } from "../src/features/lares/domain/shelter.entity";
import { ShelterStatus } from "../src/features/lares/domain/shelter-status.vo";

const { mockRequireUser, mockCreateSupabaseForUser, repoMocks } = vi.hoisted(() => {
  return {
    mockRequireUser: vi.fn(),
    mockCreateSupabaseForUser: vi.fn(() => ({})),
    repoMocks: {
      list: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      update: vi.fn(),
      inativar: vi.fn(),
      listAnimais: vi.fn(),
      findVoluntarioResumo: vi.fn(),
      contarAnimais: vi.fn(),
      findAnimal: vi.fn(),
      vincularAnimal: vi.fn(),
      desvincularAnimal: vi.fn(),
    },
  };
});

vi.mock("@/middleware/auth", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseForUser: mockCreateSupabaseForUser,
}));

vi.mock("../src/features/lares/shelter.repository", () => ({
  ShelterRepository: vi.fn().mockImplementation(function ShelterRepository() {
    return repoMocks;
  }),
}));

const { shelterController } = await import("../src/features/lares/controller");

function fakeRequest(url: string): NextRequest {
  return { nextUrl: new URL(url) } as unknown as NextRequest;
}

const AUTH_USER = { id: "user-1", email: "equipe@amemais.org", accessToken: "token-equipe" };

describe("ShelterController.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sem filtros -> 200 com a lista e os metadados de paginação nos headers", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares"));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Limit")).toBe("20");
    expect(response.headers.get("X-Offset")).toBe("0");
    expect(response.headers.get("X-Total-Count")).toBe("0");
  });

  it("lista vazia -> 200 com data: [] (nunca 404)", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("filtro sem resultado -> 200 com data: [] e total 0", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    const response = await shelterController.list(
      fakeRequest("https://api.test/api/lares?busca=NenhumLarTemEsseNome"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("página além do fim -> 200 com data: [] e total refletindo os registros existentes", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 3 });

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares?offset=999"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(response.headers.get("X-Total-Count")).toBe("3");
  });

  it("status inválido -> 400 com issues, sem consultar o repository", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares?status=fechado"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.issues).toBeDefined();
    expect(repoMocks.list).not.toHaveBeenCalled();
  });

  it("comVagas inválido (não é 'true'/'false') -> 400", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares?comVagas=yes"));

    expect(response.status).toBe(400);
  });

  it("limit inválido -> 400", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares?limit=0"));

    expect(response.status).toBe(400);
  });

  it("filtros e paginação passam pela query string e chegam ao repository.list()", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    await shelterController.list(
      fakeRequest("https://api.test/api/lares?status=disponivel&busca=Centro&comVagas=true&limit=5&offset=10"),
    );

    expect(repoMocks.list).toHaveBeenCalledWith({
      status: "disponivel",
      busca: "Centro",
      comVagas: true,
      limit: 5,
      offset: 10,
    });
  });

  it("dados com ocupacao e vagas chegam na resposta", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    const shelter = Shelter.restore({
      id: "lar-1",
      nomeResponsavel: "Maria Silva",
      contato: "33999990000",
      capacidade: 5,
      status: ShelterStatus.from("disponivel"),
      enderecoRegiao: "Centro",
      aceitaGatos: false,
      aceitaCachorros: false,
      observacoes: null,
      voluntarioId: null,
      isActive: true,
      createdAt: "2026-10-14T00:00:00.000Z",
    });
    repoMocks.list.mockResolvedValueOnce({
      items: [{ shelter, ocupacao: 2, vagas: 3 }],
      total: 1,
    });

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares"));
    const body = await response.json();

    expect(body.data[0].ocupacao).toBe(2);
    expect(body.data[0].vagas).toBe(3);
  });

  it("erro inesperado do banco -> 500, nunca mascarado como lista vazia", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.list.mockRejectedValueOnce(new Error("falha de conexão"));

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares"));

    expect(response.status).toBe(500);
  });

  it("sem token válido -> 401, e o repository não é consultado", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Token de autenticação ausente"));

    const response = await shelterController.list(fakeRequest("https://api.test/api/lares"));

    expect(response.status).toBe(401);
    expect(repoMocks.list).not.toHaveBeenCalled();
  });

  it("usa createSupabaseForUser (o client do próprio usuário), nunca um client administrativo", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    await shelterController.list(fakeRequest("https://api.test/api/lares"));

    expect(mockCreateSupabaseForUser).toHaveBeenCalledWith(AUTH_USER.accessToken);
  });
});
