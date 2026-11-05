import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

/**
 * Conta com nível 'leitura': nenhuma rota de escrita pode chegar no use case/repository.
 * `check_user_access(modulo, 'total')` volta false -> 403 antes de ler o corpo.
 */
const { mockRequireUser, rpc } = vi.hoisted(() => ({ mockRequireUser: vi.fn(), rpc: vi.fn() }));

vi.mock("@/middleware/auth", () => ({ requireUser: mockRequireUser }));
vi.mock("@/lib/supabase", () => ({ createSupabaseForUser: vi.fn(() => ({ rpc })) }));
vi.mock("@/lib/public-site", () => ({ avisarSiteDepois: vi.fn() }));

const { animalController } = await import("../src/features/animals/controller");
const { shelterController } = await import("../src/features/lares/controller");
const { voluntarioController } = await import("../src/features/voluntarios/controller");
const { eventController } = await import("../src/features/events/controller");
const { urgencyController } = await import("../src/features/urgencies/controller");
const { MODULOS_RBAC } = await import("../src/core/acesso");

const ID = "11111111-1111-4111-8111-111111111111";
const CTX = { params: Promise.resolve({ id: ID, animalId: ID }) };
const corpoNaoDeveSerLido = () => {
  throw new Error("o corpo não deveria ser lido antes da checagem de permissão");
};
const REQUEST = { json: corpoNaoDeveSerLido, formData: corpoNaoDeveSerLido, headers: new Headers() } as unknown as NextRequest;

type Handler = (request: NextRequest, context: typeof CTX) => Promise<Response>;

const ROTAS_DE_ESCRITA: Array<[string, string, Handler]> = [
  ["animais POST", MODULOS_RBAC.animais, animalController.create as Handler],
  ["animais PATCH", MODULOS_RBAC.animais, animalController.updateStatus as Handler],
  ["animais DELETE", MODULOS_RBAC.animais, animalController.delete as Handler],
  ["lares POST", MODULOS_RBAC.lares, shelterController.create as Handler],
  ["lares PUT", MODULOS_RBAC.lares, shelterController.update as Handler],
  ["lares PATCH", MODULOS_RBAC.lares, shelterController.updateStatus as Handler],
  ["lares DELETE", MODULOS_RBAC.lares, shelterController.delete as Handler],
  ["lares/:id/animais POST", MODULOS_RBAC.lares, shelterController.addAnimal as Handler],
  ["lares/:id/animais/:animalId DELETE", MODULOS_RBAC.lares, shelterController.removeAnimal as Handler],
  ["voluntarios POST", MODULOS_RBAC.voluntarios, voluntarioController.create as Handler],
  ["voluntarios PUT", MODULOS_RBAC.voluntarios, voluntarioController.update as Handler],
  ["voluntarios PATCH", MODULOS_RBAC.voluntarios, voluntarioController.updateStatus as Handler],
  ["voluntarios DELETE", MODULOS_RBAC.voluntarios, voluntarioController.delete as Handler],
  ["eventos POST", MODULOS_RBAC.eventos, eventController.create as Handler],
  ["eventos PUT", MODULOS_RBAC.eventos, eventController.update as Handler],
  ["eventos DELETE", MODULOS_RBAC.eventos, eventController.delete as Handler],
  ["urgencias POST", MODULOS_RBAC.urgencias, urgencyController.create as Handler],
  ["urgencias PUT", MODULOS_RBAC.urgencias, urgencyController.update as Handler],
  ["urgencias DELETE", MODULOS_RBAC.urgencias, urgencyController.delete as Handler],
  ["urgencias doação", MODULOS_RBAC.urgencias, urgencyController.registerDonation as Handler],
];

describe("conta 'leitura' não escreve (403 em toda rota de escrita)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "u1", email: "leitura@qa.com", accessToken: "t" });
    rpc.mockResolvedValue({ data: false, error: null });
  });

  it.each(ROTAS_DE_ESCRITA)("%s -> 403 e confere nível 'total' no módulo certo", async (_nome, modulo, handler) => {
    const response = await handler(REQUEST, CTX);

    expect(response.status).toBe(403);
    expect(rpc).toHaveBeenCalledWith("check_user_access", { modulo_slug: modulo, nivel_minimo: "total" });
  });

  it("falha ao consultar a permissão não libera a escrita (500, nunca sucesso)", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "falha" } });
    const response = await animalController.delete(REQUEST, CTX);
    expect(response.status).toBe(500);
  });
});
