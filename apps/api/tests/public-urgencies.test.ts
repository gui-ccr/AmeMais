import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicUrgencyListSchema } from "@amemais/shared-types";

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
import { mapRowToPublicUrgency } from "../src/features/public/public-urgency.mapper";
import {
  PublicUrgencyRepository,
  type IPublicUrgencyRepository,
  type PublicUrgencyRow,
} from "../src/features/public/public-urgency.repository";
import { ListPublicUrgenciesUseCase } from "../src/features/public/use-cases/list-public-urgencies.use-case";

let seq = 0;
const row = (overrides: Partial<PublicUrgencyRow> = {}): PublicUrgencyRow => {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    titulo: `Urgência ${seq}`,
    descricao: null,
    meta_arrecadacao: 20,
    valor_arrecadado: 9,
    unidade: "kg",
    prioridade: "importante",
    data_limite: null,
    created_at: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
};

/** Monta o encadeamento from().select().eq().limit() do supabase-js. */
function mockQuery(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[]> = {};
  const chain = {
    select: vi.fn((...args: unknown[]) => ((calls.select = args), chain)),
    eq: vi.fn((...args: unknown[]) => ((calls.eq = args), chain)),
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

describe("ListPublicUrgenciesUseCase — ordem do mural", () => {
  const useCaseFor = (rows: PublicUrgencyRow[]) =>
    new ListPublicUrgenciesUseCase({ listActive: async () => rows } satisfies IPublicUrgencyRepository);

  it("ordena por prioridade: urgente, importante, contínua", async () => {
    const result = await useCaseFor([
      row({ titulo: "C", prioridade: "continua" }),
      row({ titulo: "A", prioridade: "urgente" }),
      row({ titulo: "B", prioridade: "importante" }),
    ]).execute();
    expect(result.map((u) => u.titulo)).toEqual(["A", "B", "C"]);
  });

  it("na mesma prioridade, prazo mais próximo primeiro e sem prazo por último", async () => {
    const result = await useCaseFor([
      row({ titulo: "sem prazo", data_limite: null }),
      row({ titulo: "longe", data_limite: "2026-12-31" }),
      row({ titulo: "perto", data_limite: "2026-10-10" }),
    ]).execute();
    expect(result.map((u) => u.titulo)).toEqual(["perto", "longe", "sem prazo"]);
  });

  it("empate total: a mais nova primeiro", async () => {
    const result = await useCaseFor([
      row({ titulo: "velha", created_at: "2026-09-01T00:00:00.000Z" }),
      row({ titulo: "nova", created_at: "2026-10-04T00:00:00.000Z" }),
    ]).execute();
    expect(result.map((u) => u.titulo)).toEqual(["nova", "velha"]);
  });

  it("não altera a lista original e aceita lista vazia", async () => {
    const original = [row({ prioridade: "continua" }), row({ prioridade: "urgente" })];
    const copy = [...original];
    await useCaseFor(original).execute();
    expect(original).toEqual(copy);
    await expect(useCaseFor([]).execute()).resolves.toEqual([]);
  });
});

describe("mapRowToPublicUrgency — só sai o que o contrato lista", () => {
  it("converte numeric que chega como string e respeita nulos", () => {
    const mapped = mapRowToPublicUrgency(
      row({ meta_arrecadacao: "1000.50" as unknown as number, valor_arrecadado: "450" as unknown as number }),
    );
    expect(mapped.metaArrecadacao).toBe(1000.5);
    expect(mapped.valorArrecadado).toBe(450);
    expect(mapRowToPublicUrgency(row({ meta_arrecadacao: null })).metaArrecadacao).toBeNull();
  });

  it("não deixa passar campos extras da linha do banco", () => {
    const sujo = { ...row(), is_active: true, tipo: "racao", created_by: "alguem", segredo: "x" };
    const mapped = mapRowToPublicUrgency(sujo as PublicUrgencyRow);
    expect(Object.keys(mapped).sort()).toEqual(
      ["dataLimite", "descricao", "id", "metaArrecadacao", "prioridade", "titulo", "unidade", "valorArrecadado"].sort(),
    );
  });
});

describe("PublicUrgencyRepository", () => {
  it("lê só de urgency_items, com colunas fixas (sem '*'), só ativas e com teto de itens", async () => {
    const { calls } = mockQuery({ data: [row()], error: null });
    const result = await new PublicUrgencyRepository(fakeDb as never).listActive();

    expect(fakeDb.from).toHaveBeenCalledWith("urgency_items");
    const columns = String(calls.select?.[0]);
    expect(columns).not.toContain("*");
    expect(columns).not.toContain("is_active");
    expect(columns).not.toContain("tipo");
    expect(calls.eq).toEqual(["is_active", true]);
    expect(calls.limit).toEqual([50]);
    expect(result).toHaveLength(1);
  });

  it("erro do banco vira DatabaseError e data nula vira lista vazia", async () => {
    mockQuery({ data: null, error: { message: "boom" } });
    await expect(new PublicUrgencyRepository(fakeDb as never).listActive()).rejects.toBeInstanceOf(DatabaseError);

    mockQuery({ data: null, error: null });
    await expect(new PublicUrgencyRepository(fakeDb as never).listActive()).resolves.toEqual([]);
  });
});

describe("GET /api/public/urgencias (controller)", () => {
  it("responde 200 sem login, com o contrato público, sem cache de CDN e usando o client anônimo", async () => {
    mockQuery({
      data: [
        row({ titulo: "Ração", prioridade: "urgente", data_limite: "2026-10-20" }),
        row({ titulo: "Cobertores", prioridade: "continua" }),
      ],
      error: null,
    });

    const response = await publicController.listUrgencies();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(publicUrgencyListSchema.safeParse(body).success).toBe(true);
    expect(body.data.map((u: { titulo: string }) => u.titulo)).toEqual(["Ração", "Cobertores"]);

    expect(createSupabaseAnon).toHaveBeenCalledTimes(1);
    expect(requireUser).not.toHaveBeenCalled();
    expect(createSupabaseForUser).not.toHaveBeenCalled();
  });

  it("falha do banco: 500 com mensagem genérica (sem detalhe interno) e também sem cache", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery({ data: null, error: { message: "relation urgency_items password=abc" } });

    const response = await publicController.listUrgencies();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const text = JSON.stringify(await response.json());
    expect(text).toBe(JSON.stringify({ error: "Erro ao acessar o banco de dados" }));
    expect(text).not.toContain("password");
  });
});
