import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { Doacao } from "../src/features/doacoes/domain/doacao.entity";
import { ForbiddenError, NotFoundError } from "../src/core/errors";

const { mockRequireUser, mockCreateSupabaseForUser, mockExigirNivelTotal, repoMocks } = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
  mockCreateSupabaseForUser: vi.fn(() => ({})),
  mockExigirNivelTotal: vi.fn(),
  repoMocks: { list: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

vi.mock("@/middleware/auth", () => ({ requireUser: mockRequireUser }));
vi.mock("@/lib/supabase", () => ({ createSupabaseForUser: mockCreateSupabaseForUser }));
vi.mock("@/core/acesso", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/core/acesso")>()),
  exigirNivelTotal: mockExigirNivelTotal,
}));
vi.mock("../src/features/doacoes/doacao.repository", () => ({
  DoacaoRepository: vi.fn().mockImplementation(function () {
    return repoMocks;
  }),
}));

const { doacaoController } = await import("../src/features/doacoes/controller");

const ID = "5b0f4f6e-0b1f-4c53-9a54-2f2d3d4c1a11";
const corpo = {
  descricao: "6 sacos de ração",
  quantidade: 90,
  unidade: "kg",
  categoria: "racao",
  localColeta: "Pet Shop",
  dataEntrada: "2026-10-01",
};

const doacao = () =>
  Doacao.restore({
    id: ID,
    descricao: "6 sacos de ração",
    quantidade: 90,
    unidade: "kg",
    categoria: "racao",
    localColeta: "Pet Shop",
    dataEntrada: "2026-10-01",
    urlFoto: null,
    urgenciaId: null,
    doadorNome: null,
    doadorTelefone: null,
    doadorCpf: null,
    registradoPor: "Maria",
    createdAt: "2026-10-01T10:00:00.000Z",
  });

const req = (body?: unknown) => ({ json: async () => body }) as unknown as NextRequest;
const params = { params: Promise.resolve({ id: ID }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue({ id: "u1", email: null, accessToken: "t" });
  mockExigirNivelTotal.mockResolvedValue(undefined);
});

describe("DoacaoController", () => {
  it("GET lista não exige nível total", async () => {
    repoMocks.list.mockResolvedValue([doacao()]);
    const res = await doacaoController.list(req());
    expect(res.status).toBe(200);
    expect(mockExigirNivelTotal).not.toHaveBeenCalled();
    const json = (await res.json()) as { data: { registradoPor: string }[] };
    expect(json.data[0]?.registradoPor).toBe("Maria");
  });

  it("GET por id inexistente devolve 404", async () => {
    repoMocks.findById.mockRejectedValue(new NotFoundError("Doação"));
    expect((await doacaoController.getById(req(), params)).status).toBe(404);
  });

  it("POST cria (201) e ignora registradoPor enviado pelo cliente", async () => {
    repoMocks.create.mockResolvedValue(doacao());
    const res = await doacaoController.create(req({ ...corpo, registradoPor: "Fulano" }));
    expect(res.status).toBe(201);
    expect(mockExigirNivelTotal).toHaveBeenCalledOnce();
    expect(repoMocks.create.mock.calls[0]?.[0]).not.toHaveProperty("registradoPor");
  });

  it("POST com corpo inválido devolve 400 e não grava", async () => {
    const res = await doacaoController.create(req({ ...corpo, quantidade: 0 }));
    expect(res.status).toBe(400);
    expect(repoMocks.create).not.toHaveBeenCalled();
  });

  it("escrita sem nível total devolve 403", async () => {
    mockExigirNivelTotal.mockRejectedValue(new ForbiddenError());
    expect((await doacaoController.create(req(corpo))).status).toBe(403);
    expect((await doacaoController.update(req({ descricao: "ab" }), params)).status).toBe(403);
    expect((await doacaoController.delete(req(), params)).status).toBe(403);
    expect(repoMocks.create).not.toHaveBeenCalled();
    expect(repoMocks.remove).not.toHaveBeenCalled();
  });

  it("PUT atualiza parcialmente", async () => {
    repoMocks.findById.mockResolvedValue(doacao());
    repoMocks.update.mockResolvedValue(doacao());
    const res = await doacaoController.update(req({ quantidade: 100 }), params);
    expect(res.status).toBe(200);
    expect(repoMocks.update).toHaveBeenCalledWith(ID, { quantidade: 100 });
  });

  it("DELETE remove", async () => {
    repoMocks.remove.mockResolvedValue(undefined);
    const res = await doacaoController.delete(req(), params);
    expect(res.status).toBe(200);
    expect(repoMocks.remove).toHaveBeenCalledWith(ID);
  });
});
