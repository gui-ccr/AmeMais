import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { Urgency } from "../src/features/urgencies/domain/urgency.entity";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "../src/core/errors";

const { mockRequireUser, mockCreateSupabaseForUser, repoMocks } = vi.hoisted(() => {
  return {
    mockRequireUser: vi.fn(),
    mockCreateSupabaseForUser: vi.fn(() => ({ rpc: async () => ({ data: true, error: null }) })), // nível total (core/acesso)
    repoMocks: {
      list: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateValorArrecadado: vi.fn(),
      remove: vi.fn(),
    },
  };
});

vi.mock("@/middleware/auth", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/supabase", () => ({
  createSupabaseForUser: mockCreateSupabaseForUser,
}));

vi.mock("../src/features/urgencies/urgency.repository", () => ({
  UrgencyRepository: vi.fn().mockImplementation(function () {
    return repoMocks;
  }),
}));

const { urgencyController } = await import("../src/features/urgencies/controller");

function fakeRequest(body?: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

const AUTH_ADMIN = { id: "admin-1", email: "admin@amemais.org", accessToken: "token-admin" };
const AUTH_VOLUNTARIO = { id: "vol-1", email: "voluntario@amemais.org", accessToken: "token-vol" };

const SAMPLE_URGENCY = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
  id: "11111111-1111-1111-1111-111111111111",
  titulo: "Cirurgia urgente",
  descricao: "Fratura exposta",
  metaArrecadacao: 1000,
  valorArrecadado: 200,
  isActive: true,
  createdAt: "2026-09-16T10:00:00.000Z",
});

describe("UrgencyController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Autenticação", () => {
    it("list: sem token válido -> 401, e o use case não é executado", async () => {
      mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Token de autenticação ausente"));

      const response = await urgencyController.list(fakeRequest());

      expect(response.status).toBe(401);
      expect(repoMocks.list).not.toHaveBeenCalled();
    });
  });

  describe("list (leitura liberada a qualquer autenticado)", () => {
    it("usuário autenticado -> 200 com a lista", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.list.mockResolvedValueOnce([SAMPLE_URGENCY]);

      const response = await urgencyController.list(fakeRequest());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].titulo).toBe("Cirurgia urgente");
    });
  });

  describe("getById", () => {
    it("usuário autenticado -> 200 com a urgência", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.findById.mockResolvedValueOnce(SAMPLE_URGENCY);

      const response = await urgencyController.getById(fakeRequest(), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.id).toBe(SAMPLE_URGENCY.id);
    });

    it("id inexistente -> 404 (NotFoundError propagado do repository)", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.findById.mockRejectedValueOnce(new NotFoundError("Urgência"));

      const response = await urgencyController.getById(fakeRequest(), {
        params: Promise.resolve({ id: "22222222-2222-2222-2222-222222222222" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("create (Admin ou Voluntário)", () => {
    const payload = { titulo: "Ração medicada", metaArrecadacao: 500, valorArrecadado: 0 };

    it("Admin -> 201", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_ADMIN);
      repoMocks.create.mockResolvedValueOnce(
        Urgency.restore({ unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null, id: "new-1", ...payload, descricao: null, isActive: false, createdAt: "2026-09-16T10:00:00Z" }),
      );

      const response = await urgencyController.create(fakeRequest(payload));

      expect(response.status).toBe(201);
      expect(repoMocks.create).toHaveBeenCalledTimes(1);
    });

    it("Voluntário -> 201", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.create.mockResolvedValueOnce(
        Urgency.restore({ unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null, id: "new-2", ...payload, descricao: null, isActive: false, createdAt: "2026-09-16T10:00:00Z" }),
      );

      const response = await urgencyController.create(fakeRequest(payload));

      expect(response.status).toBe(201);
    });

    it("body inválido (sem titulo) -> 400, repository não é chamado", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_ADMIN);

      const response = await urgencyController.create(fakeRequest({ valorArrecadado: 0 }));

      expect(response.status).toBe(400);
      expect(repoMocks.create).not.toHaveBeenCalled();
    });

    it("cargo sem permissão de escrita (RLS barra o INSERT) -> 403", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.create.mockRejectedValueOnce(new ForbiddenError());

      const response = await urgencyController.create(fakeRequest(payload));

      expect(response.status).toBe(403);
    });
  });

  describe("update (Admin ou Voluntário)", () => {
    it("Admin -> 200", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_ADMIN);
      repoMocks.findById.mockResolvedValueOnce(SAMPLE_URGENCY);
      repoMocks.update.mockResolvedValueOnce(
        Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
          id: SAMPLE_URGENCY.id,
          titulo: "Cirurgia urgente - atualizado",
          descricao: SAMPLE_URGENCY.descricao,
          metaArrecadacao: SAMPLE_URGENCY.metaArrecadacao,
          valorArrecadado: SAMPLE_URGENCY.valorArrecadado,
          isActive: SAMPLE_URGENCY.isActive,
          createdAt: SAMPLE_URGENCY.createdAt,
        }),
      );

      const response = await urgencyController.update(fakeRequest({ titulo: "Cirurgia urgente - atualizado" }), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });

      expect(response.status).toBe(200);
    });

    it("Voluntário -> 200", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.findById.mockResolvedValueOnce(SAMPLE_URGENCY);
      repoMocks.update.mockResolvedValueOnce(SAMPLE_URGENCY);

      const response = await urgencyController.update(fakeRequest({ isActive: false }), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });

      expect(response.status).toBe(200);
    });

    it("id com formato inválido -> 400", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_ADMIN);

      const response = await urgencyController.update(fakeRequest({ titulo: "x" }), {
        params: Promise.resolve({ id: "nao-e-uuid" }),
      });

      expect(response.status).toBe(400);
      expect(repoMocks.findById).not.toHaveBeenCalled();
    });
  });

  describe("delete (somente Admin)", () => {
    it("Admin -> 200 { deleted: true }", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_ADMIN);
      repoMocks.remove.mockResolvedValueOnce(undefined);

      const response = await urgencyController.delete(fakeRequest(), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual({ deleted: true });
    });

    it("Voluntário -> 403 (RLS de DELETE só permite Admin)", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.remove.mockRejectedValueOnce(new ForbiddenError());

      const response = await urgencyController.delete(fakeRequest(), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });

      expect(response.status).toBe(403);
    });

    it("sem autenticação -> 401, use case não executado", async () => {
      mockRequireUser.mockRejectedValueOnce(new UnauthorizedError());

      const response = await urgencyController.delete(fakeRequest(), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });

      expect(response.status).toBe(401);
      expect(repoMocks.remove).not.toHaveBeenCalled();
    });
  });

  describe("registerDonation (mesma regra de escrita: Admin ou Voluntário)", () => {
    it("usuário autorizado -> chama o use case e retorna 200 com o total atualizado", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.findById.mockResolvedValueOnce(SAMPLE_URGENCY);
      repoMocks.updateValorArrecadado.mockResolvedValueOnce(
        Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
          id: SAMPLE_URGENCY.id,
          titulo: SAMPLE_URGENCY.titulo,
          descricao: SAMPLE_URGENCY.descricao,
          metaArrecadacao: SAMPLE_URGENCY.metaArrecadacao,
          valorArrecadado: 400,
          isActive: SAMPLE_URGENCY.isActive,
          createdAt: SAMPLE_URGENCY.createdAt,
        }),
      );

      const response = await urgencyController.registerDonation(fakeRequest({ valor: 200 }), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.valorArrecadado).toBe(400);
      expect(repoMocks.updateValorArrecadado).toHaveBeenCalledWith(SAMPLE_URGENCY.id, 400);
    });

    it("cargo sem permissão de escrita -> 403, nada é persistido", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_VOLUNTARIO);
      repoMocks.findById.mockResolvedValueOnce(SAMPLE_URGENCY);
      repoMocks.updateValorArrecadado.mockRejectedValueOnce(new ForbiddenError());

      const response = await urgencyController.registerDonation(fakeRequest({ valor: 200 }), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });

      expect(response.status).toBe(403);
    });

    it("valor inválido (<=0) -> 400 antes mesmo de chamar o repository de escrita", async () => {
      mockRequireUser.mockResolvedValueOnce(AUTH_ADMIN);

      const response = await urgencyController.registerDonation(fakeRequest({ valor: 0 }), {
        params: Promise.resolve({ id: SAMPLE_URGENCY.id }),
      });

      expect(response.status).toBe(400);
      expect(repoMocks.updateValorArrecadado).not.toHaveBeenCalled();
    });
  });
});
