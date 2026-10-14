import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { NotFoundError, UnauthorizedError } from "../src/core/errors";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";

const { mockRequireUser, mockCreateSupabaseForUser, repoMocks } = vi.hoisted(() => {
  return {
    mockRequireUser: vi.fn(),
    mockCreateSupabaseForUser: vi.fn(() => ({})),
    repoMocks: {
      temAcessoDeLeitura: vi.fn(),
      list: vi.fn(),
      existsByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      findLarVinculado: vi.fn(),
      update: vi.fn(),
    },
  };
});

vi.mock("@/middleware/auth", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseForUser: mockCreateSupabaseForUser,
}));

vi.mock("../src/features/voluntarios/voluntario.repository", () => ({
  VoluntarioRepository: vi.fn().mockImplementation(function VoluntarioRepository() {
    return repoMocks;
  }),
}));

const { voluntarioController } = await import("../src/features/voluntarios/controller");

function fakeRequest(url: string): NextRequest {
  return {
    nextUrl: new URL(url),
  } as unknown as NextRequest;
}

function fakePostRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

function fakeItemRequest(id: string) {
  return { request: {} as unknown as NextRequest, context: { params: Promise.resolve({ id }) } };
}

function fakePutRequest(id: string, body: unknown) {
  return {
    request: { json: async () => body } as unknown as NextRequest,
    context: { params: Promise.resolve({ id }) },
  };
}

const AUTH_USER = { id: "user-1", email: "equipe@amemais.org", accessToken: "token-equipe" };

const CORPO_VALIDO = {
  nome: "Ana Silva",
  email: "ana@exemplo.com",
  telefone: "(33) 99876-5432",
  tipo: "apoio_geral" as const,
  bairro: "Centro",
  areasDeAjuda: ["eventos"],
};

const VOLUNTARIO_CRIADO = {
  id: "vol-1",
  nome: "Ana Silva",
  email: "ana@exemplo.com",
  telefone: "33998765432",
  tipo: "apoio_geral",
  status: "ativo",
  bairro: "Centro",
  areasDeAjuda: ["eventos"],
  createdAt: "2026-10-14T00:00:00.000Z",
};

describe("VoluntarioController.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sem token válido -> 401, e o repository não é consultado", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Token de autenticação ausente"));

    const response = await voluntarioController.list(fakeRequest("https://api.test/api/voluntarios"));

    expect(response.status).toBe(401);
    expect(repoMocks.temAcessoDeLeitura).not.toHaveBeenCalled();
  });

  it("usuário autenticado sem permissão no módulo -> 403, e list() não é chamado", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.temAcessoDeLeitura.mockResolvedValueOnce(false);

    const response = await voluntarioController.list(fakeRequest("https://api.test/api/voluntarios"));

    expect(response.status).toBe(403);
    expect(repoMocks.list).not.toHaveBeenCalled();
  });

  it("usuário autorizado -> 200 com a lista e os metadados de paginação nos headers", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.temAcessoDeLeitura.mockResolvedValueOnce(true);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 1 });

    // O repository é mockado, então `items` precisa ser `[]` aqui (o use case
    // chamaria `toVoluntarioDTO` em cada item, que espera uma entidade `Voluntario`
    // de verdade). O conteúdo do DTO já é testado em voluntario.list-use-case.test.ts;
    // aqui o foco é status HTTP e os headers de paginação.
    const response = await voluntarioController.list(
      fakeRequest("https://api.test/api/voluntarios?page=1&limit=20"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Page")).toBe("1");
    expect(response.headers.get("X-Limit")).toBe("20");
    expect(response.headers.get("X-Total-Count")).toBe("1");
  });

  it("lista vazia -> 200 com data: [] (nunca 404)", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.temAcessoDeLeitura.mockResolvedValueOnce(true);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    const response = await voluntarioController.list(fakeRequest("https://api.test/api/voluntarios"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("página além do fim -> 200 com data: [] e total refletindo os registros existentes", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.temAcessoDeLeitura.mockResolvedValueOnce(true);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 3 });

    const response = await voluntarioController.list(
      fakeRequest("https://api.test/api/voluntarios?page=999&limit=20"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(response.headers.get("X-Total-Count")).toBe("3");
  });

  it("tipo inválido -> 400 com issues, sem consultar o repository", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await voluntarioController.list(
      fakeRequest("https://api.test/api/voluntarios?tipo=coordenador"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.issues).toBeDefined();
    expect(repoMocks.temAcessoDeLeitura).not.toHaveBeenCalled();
  });

  it("status inválido -> 400 com issues", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await voluntarioController.list(
      fakeRequest("https://api.test/api/voluntarios?status=pendente"),
    );

    expect(response.status).toBe(400);
  });

  it("area inválida -> 400 com issues", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await voluntarioController.list(
      fakeRequest("https://api.test/api/voluntarios?area=financeiro"),
    );

    expect(response.status).toBe(400);
  });

  it("page inválida -> 400", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await voluntarioController.list(fakeRequest("https://api.test/api/voluntarios?page=0"));

    expect(response.status).toBe(400);
  });

  it("erro inesperado do banco na listagem -> 500, nunca mascarado como lista vazia ou 403", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.temAcessoDeLeitura.mockResolvedValueOnce(true);
    repoMocks.list.mockRejectedValueOnce(new Error("falha de conexão"));

    const response = await voluntarioController.list(fakeRequest("https://api.test/api/voluntarios"));

    expect(response.status).toBe(500);
  });

  it("filtros e busca passam pela query string e chegam ao repository.list()", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.temAcessoDeLeitura.mockResolvedValueOnce(true);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    await voluntarioController.list(
      fakeRequest(
        "https://api.test/api/voluntarios?busca=Ana&tipo=veterinario&status=ativo&area=transporte&page=2&limit=5",
      ),
    );

    expect(repoMocks.list).toHaveBeenCalledWith({
      busca: "Ana",
      tipo: "veterinario",
      status: "ativo",
      area: "transporte",
      page: 2,
      limit: 5,
    });
  });

  it("usa createSupabaseForUser (o client do próprio usuário), nunca um client administrativo", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.temAcessoDeLeitura.mockResolvedValueOnce(true);
    repoMocks.list.mockResolvedValueOnce({ items: [], total: 0 });

    await voluntarioController.list(fakeRequest("https://api.test/api/voluntarios"));

    expect(mockCreateSupabaseForUser).toHaveBeenCalledWith(AUTH_USER.accessToken);
  });
});

describe("VoluntarioController.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("corpo válido -> 201 com o VoluntarioDTO criado", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.create.mockResolvedValueOnce(
      Voluntario.restore({
        id: "vol-1",
        createdAt: "2026-10-14T00:00:00.000Z",
        ...Voluntario.create({
          nome: "Ana Silva",
          email: "ana@exemplo.com",
          telefone: "(33) 99876-5432",
          tipo: "apoio_geral",
          bairro: "Centro",
          areasDeAjuda: ["eventos"],
        }),
      }),
    );

    const response = await voluntarioController.create(fakePostRequest(CORPO_VALIDO));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual(VOLUNTARIO_CRIADO);
  });

  it("email: null -> 201, e existsByEmail não é consultado", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.create.mockResolvedValueOnce(
      Voluntario.restore({
        id: "vol-2",
        createdAt: "2026-10-14T00:00:00.000Z",
        ...Voluntario.create({ nome: "João Souza", telefone: "33998765432", tipo: "veterinario", email: null }),
      }),
    );

    const response = await voluntarioController.create(fakePostRequest({ ...CORPO_VALIDO, email: null }));

    expect(response.status).toBe(201);
    expect(repoMocks.existsByEmail).not.toHaveBeenCalled();
  });

  it("bairro: null -> 201", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.create.mockResolvedValueOnce(
      Voluntario.restore({
        id: "vol-3",
        createdAt: "2026-10-14T00:00:00.000Z",
        ...Voluntario.create({ ...CORPO_VALIDO, bairro: null }),
      }),
    );

    const response = await voluntarioController.create(fakePostRequest({ ...CORPO_VALIDO, bairro: null }));

    expect(response.status).toBe(201);
  });

  it("areasDeAjuda: [] -> 201", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.create.mockResolvedValueOnce(
      Voluntario.restore({
        id: "vol-4",
        createdAt: "2026-10-14T00:00:00.000Z",
        ...Voluntario.create({ ...CORPO_VALIDO, areasDeAjuda: [] }),
      }),
    );

    const response = await voluntarioController.create(fakePostRequest({ ...CORPO_VALIDO, areasDeAjuda: [] }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.areasDeAjuda).toEqual([]);
  });

  it("corpo inválido (tipo fora da lista) -> 400 com issues, sem chamar create()", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const response = await voluntarioController.create(
      fakePostRequest({ ...CORPO_VALIDO, tipo: "coordenador" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.issues).toBeDefined();
    expect(repoMocks.create).not.toHaveBeenCalled();
  });

  it("corpo sem telefone -> 400, sem chamar create()", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    const { telefone, ...corpoSemTelefone } = CORPO_VALIDO;
    void telefone;

    const response = await voluntarioController.create(fakePostRequest(corpoSemTelefone));

    expect(response.status).toBe(400);
    expect(repoMocks.create).not.toHaveBeenCalled();
  });

  it("'status' enviado pelo cliente é ignorado pelo schema — não derruba a requisição nem muda o resultado", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.create.mockResolvedValueOnce(
      Voluntario.restore({
        id: "vol-5",
        createdAt: "2026-10-14T00:00:00.000Z",
        ...Voluntario.create(CORPO_VALIDO),
      }),
    );

    const response = await voluntarioController.create(fakePostRequest({ ...CORPO_VALIDO, status: "inativo" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.status).toBe("ativo");
  });

  it("e-mail já cadastrado -> 409, sem chamar create()", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(true);

    const response = await voluntarioController.create(fakePostRequest(CORPO_VALIDO));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Já existe um voluntário cadastrado com este e-mail.");
    expect(repoMocks.create).not.toHaveBeenCalled();
  });

  it("violação do índice único detectada só no insert (condição de corrida) -> 409", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    const { ConflictError } = await import("../src/core/errors");
    repoMocks.create.mockRejectedValueOnce(new ConflictError("Já existe um voluntário cadastrado com este e-mail."));

    const response = await voluntarioController.create(fakePostRequest(CORPO_VALIDO));

    expect(response.status).toBe(409);
  });

  it("falha inesperada do banco -> 500, nunca 409", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.create.mockRejectedValueOnce(new Error("conexão perdida"));

    const response = await voluntarioController.create(fakePostRequest(CORPO_VALIDO));

    expect(response.status).toBe(500);
  });

  it("sem token válido -> 401, sem chamar o repository", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Token de autenticação ausente"));

    const response = await voluntarioController.create(fakePostRequest(CORPO_VALIDO));

    expect(response.status).toBe(401);
    expect(repoMocks.create).not.toHaveBeenCalled();
  });

  it("usa createSupabaseForUser (o client do próprio usuário), nunca um client administrativo", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.create.mockResolvedValueOnce(
      Voluntario.restore({
        id: "vol-6",
        createdAt: "2026-10-14T00:00:00.000Z",
        ...Voluntario.create(CORPO_VALIDO),
      }),
    );

    await voluntarioController.create(fakePostRequest(CORPO_VALIDO));

    expect(mockCreateSupabaseForUser).toHaveBeenCalledWith(AUTH_USER.accessToken);
  });
});

const ID_VALIDO = "11111111-1111-1111-1111-111111111111";

function voluntarioRestaurado(id: string, overrides: Partial<typeof CORPO_VALIDO> = {}) {
  return Voluntario.restore({
    id,
    createdAt: "2026-10-14T00:00:00.000Z",
    ...Voluntario.create({ ...CORPO_VALIDO, ...overrides }),
  });
}

describe("VoluntarioController.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("voluntário existente, sem lar vinculado -> 200 com larTemporario: null", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.findLarVinculado.mockResolvedValueOnce(null);

    const { request, context } = fakeItemRequest(ID_VALIDO);
    const response = await voluntarioController.getById(request, context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(ID_VALIDO);
    expect(body.data.larTemporario).toBeNull();
  });

  it("voluntário com lar vinculado -> inclui id e enderecoRegiao do lar", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.findLarVinculado.mockResolvedValueOnce({ id: "lar-1", enderecoRegiao: "Zona Norte" });

    const { request, context } = fakeItemRequest(ID_VALIDO);
    const response = await voluntarioController.getById(request, context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.larTemporario).toEqual({ id: "lar-1", enderecoRegiao: "Zona Norte" });
  });

  it("id inexistente -> 404", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockRejectedValueOnce(new NotFoundError("Voluntário"));

    const { request, context } = fakeItemRequest(ID_VALIDO);
    const response = await voluntarioController.getById(request, context);

    expect(response.status).toBe(404);
  });

  it("id malformado (não-UUID) -> 400, sem consultar o repository", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const { request, context } = fakeItemRequest("não-é-um-uuid");
    const response = await voluntarioController.getById(request, context);

    expect(response.status).toBe(400);
    expect(repoMocks.findById).not.toHaveBeenCalled();
  });

  it("falha inesperada do banco -> 500, nunca 404", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockRejectedValueOnce(new Error("conexão perdida"));

    const { request, context } = fakeItemRequest(ID_VALIDO);
    const response = await voluntarioController.getById(request, context);

    expect(response.status).toBe(500);
  });

  it("sem token válido -> 401, sem consultar o repository", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Token de autenticação ausente"));

    const { request, context } = fakeItemRequest(ID_VALIDO);
    const response = await voluntarioController.getById(request, context);

    expect(response.status).toBe(401);
    expect(repoMocks.findById).not.toHaveBeenCalled();
  });

  it("usa createSupabaseForUser (client do próprio usuário)", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.findLarVinculado.mockResolvedValueOnce(null);

    const { request, context } = fakeItemRequest(ID_VALIDO);
    await voluntarioController.getById(request, context);

    expect(mockCreateSupabaseForUser).toHaveBeenCalledWith(AUTH_USER.accessToken);
  });
});

describe("VoluntarioController.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("corpo válido -> 200 com a representação atualizada", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.update.mockImplementationOnce(async (_id: string, voluntario: Voluntario) => voluntario);

    const { request, context } = fakePutRequest(ID_VALIDO, { ...CORPO_VALIDO, nome: "Ana Silva Atualizada" });
    const response = await voluntarioController.update(request, context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.nome).toBe("Ana Silva Atualizada");
  });

  it("id inexistente -> 404, sem chamar existsByEmail nem update", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockRejectedValueOnce(new NotFoundError("Voluntário"));

    const { request, context } = fakePutRequest(ID_VALIDO, CORPO_VALIDO);
    const response = await voluntarioController.update(request, context);

    expect(response.status).toBe(404);
    expect(repoMocks.existsByEmail).not.toHaveBeenCalled();
    expect(repoMocks.update).not.toHaveBeenCalled();
  });

  it("mantém o próprio e-mail -> 200, sem 409", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO, { email: "ana@exemplo.com" }));
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.update.mockImplementationOnce(async (_id: string, voluntario: Voluntario) => voluntario);

    const { request, context } = fakePutRequest(ID_VALIDO, { ...CORPO_VALIDO, email: "ana@exemplo.com" });
    const response = await voluntarioController.update(request, context);

    expect(response.status).toBe(200);
  });

  it("e-mail de outro voluntário -> 409, sem chamar update", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.existsByEmail.mockResolvedValueOnce(true);

    const { request, context } = fakePutRequest(ID_VALIDO, { ...CORPO_VALIDO, email: "ocupado@exemplo.com" });
    const response = await voluntarioController.update(request, context);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Já existe um voluntário cadastrado com este e-mail.");
    expect(repoMocks.update).not.toHaveBeenCalled();
  });

  it("violação do índice único detectada só no update (corrida) -> 409", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    const { ConflictError } = await import("../src/core/errors");
    repoMocks.update.mockRejectedValueOnce(new ConflictError("Já existe um voluntário cadastrado com este e-mail."));

    const { request, context } = fakePutRequest(ID_VALIDO, CORPO_VALIDO);
    const response = await voluntarioController.update(request, context);

    expect(response.status).toBe(409);
  });

  it("corpo inválido (tipo fora da lista) -> 400, sem chamar findById", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const { request, context } = fakePutRequest(ID_VALIDO, { ...CORPO_VALIDO, tipo: "coordenador" });
    const response = await voluntarioController.update(request, context);

    expect(response.status).toBe(400);
    expect(repoMocks.findById).not.toHaveBeenCalled();
  });

  it("id malformado -> 400", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);

    const { request, context } = fakePutRequest("não-é-um-uuid", CORPO_VALIDO);
    const response = await voluntarioController.update(request, context);

    expect(response.status).toBe(400);
  });

  it("falha inesperada do banco na persistência -> 500, nunca 409", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.update.mockRejectedValueOnce(new Error("conexão perdida"));

    const { request, context } = fakePutRequest(ID_VALIDO, CORPO_VALIDO);
    const response = await voluntarioController.update(request, context);

    expect(response.status).toBe(500);
  });

  it("sem token válido -> 401", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Token de autenticação ausente"));

    const { request, context } = fakePutRequest(ID_VALIDO, CORPO_VALIDO);
    const response = await voluntarioController.update(request, context);

    expect(response.status).toBe(401);
    expect(repoMocks.findById).not.toHaveBeenCalled();
  });

  it("usa createSupabaseForUser (client do próprio usuário)", async () => {
    mockRequireUser.mockResolvedValueOnce(AUTH_USER);
    repoMocks.findById.mockResolvedValueOnce(voluntarioRestaurado(ID_VALIDO));
    repoMocks.existsByEmail.mockResolvedValueOnce(false);
    repoMocks.update.mockImplementationOnce(async (_id: string, voluntario: Voluntario) => voluntario);

    const { request, context } = fakePutRequest(ID_VALIDO, CORPO_VALIDO);
    await voluntarioController.update(request, context);

    expect(mockCreateSupabaseForUser).toHaveBeenCalledWith(AUTH_USER.accessToken);
  });
});
