import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicCollectionPointListSchema } from "@amemais/shared-types";

const { fakeDb, createSupabaseAnon, requireUser, createSupabaseForUser } = vi.hoisted(() => {
  const fakeDb = { from: vi.fn() };
  return {
    fakeDb,
    createSupabaseAnon: vi.fn(() => fakeDb),
    requireUser: vi.fn(),
    createSupabaseForUser: vi.fn(),
  };
});

vi.mock("@/lib/supabase", () => ({ createSupabaseAnon, createSupabaseForUser }));
vi.mock("@/middleware/auth", () => ({ requireUser }));

import { DatabaseError } from "../src/core/errors";
import { publicController } from "../src/features/public/controller";
import { mapRowToPublicCollectionPoint } from "../src/features/public/public-collection-point.mapper";
import {
  PublicCollectionPointRepository,
  type PublicCollectionPointRow,
} from "../src/features/public/public-collection-point.repository";

let seq = 0;
const row = (overrides: Partial<PublicCollectionPointRow> = {}): PublicCollectionPointRow => {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    nome: `Ponto ${seq}`,
    endereco: "Rua A, 10",
    horario: "seg a sex, 8h–18h",
    ...overrides,
  };
};

/** Monta o encadeamento from().select().eq().order().limit() do supabase-js. */
function mockQuery(result: { data: unknown; error: unknown }) {
  const calls = { select: [] as unknown[], eq: [] as unknown[], order: [] as unknown[], limit: [] as unknown[] };
  const chain = {
    select: vi.fn((...args: unknown[]) => ((calls.select = args), chain)),
    eq: vi.fn((...args: unknown[]) => ((calls.eq = args), chain)),
    order: vi.fn((...args: unknown[]) => ((calls.order = args), chain)),
    limit: vi.fn((...args: unknown[]) => ((calls.limit = args), Promise.resolve(result))),
  };
  fakeDb.from.mockReturnValue(chain);
  return { calls };
}

beforeEach(() => {
  seq = 0;
  vi.clearAllMocks();
  createSupabaseAnon.mockReturnValue(fakeDb);
});

describe("mapRowToPublicCollectionPoint", () => {
  it("não deixa passar campos extras da linha", () => {
    const sujo = { ...row(), ativo: true, criado_por: "alguem", segredo: "x" };
    const mapped = mapRowToPublicCollectionPoint(sujo as PublicCollectionPointRow);
    expect(Object.keys(mapped).sort()).toEqual(["endereco", "horario", "id", "nome"]);
  });

  it("horário nulo continua nulo", () => {
    expect(mapRowToPublicCollectionPoint(row({ horario: null })).horario).toBeNull();
  });
});

describe("PublicCollectionPointRepository", () => {
  it("lê só de pontos_coleta, colunas fixas, só ativos, em ordem alfabética e com teto de itens", async () => {
    const { calls } = mockQuery({ data: [row()], error: null });
    const result = await new PublicCollectionPointRepository(fakeDb as never).listActive();

    expect(fakeDb.from).toHaveBeenCalledWith("pontos_coleta");
    const columns = String(calls.select[0]);
    expect(columns).not.toContain("*");
    expect(calls.eq).toEqual(["ativo", true]);
    expect(calls.order).toEqual(["nome", { ascending: true }]);
    expect(calls.limit).toEqual([50]);
    expect(result).toHaveLength(1);
  });

  it("erro do banco vira DatabaseError e data nula vira lista vazia", async () => {
    mockQuery({ data: null, error: { message: "boom" } });
    await expect(new PublicCollectionPointRepository(fakeDb as never).listActive()).rejects.toBeInstanceOf(DatabaseError);
    mockQuery({ data: null, error: null });
    await expect(new PublicCollectionPointRepository(fakeDb as never).listActive()).resolves.toEqual([]);
  });
});

describe("GET /api/public/pontos-coleta (controller)", () => {
  it("responde 200 sem login, no contrato público, sem cache de CDN e com o client anônimo", async () => {
    mockQuery({ data: [row({ nome: "Pet Shop A" }), row({ nome: "Clínica B", horario: null })], error: null });

    const response = await publicController.listCollectionPoints();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(publicCollectionPointListSchema.safeParse(body).success).toBe(true);
    expect(body.data).toHaveLength(2);

    expect(createSupabaseAnon).toHaveBeenCalledTimes(1);
    expect(requireUser).not.toHaveBeenCalled();
    expect(createSupabaseForUser).not.toHaveBeenCalled();
  });

  it("lista vazia é 200 com data []", async () => {
    mockQuery({ data: [], error: null });
    const response = await publicController.listCollectionPoints();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [] });
  });

  it("falha do banco: 500 com mensagem genérica e sem cache", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery({ data: null, error: { message: "relation pontos_coleta password=abc" } });

    const response = await publicController.listCollectionPoints();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.stringify(await response.json())).toBe(JSON.stringify({ error: "Erro ao acessar o banco de dados" }));
  });
});
