import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { publicAnimalListSchema } from "@amemais/shared-types";

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
import { mapRowToPublicAnimal } from "../src/features/public/public-animal.mapper";
import { PublicAnimalRepository, type PublicAnimalRow } from "../src/features/public/public-animal.repository";
import { publicAnimalsQuerySchema } from "../src/features/public/schema";

let seq = 0;
const row = (overrides: Partial<PublicAnimalRow> = {}): PublicAnimalRow => {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    nome: `Animal ${seq}`,
    especie: "Cachorro",
    porte: "M",
    faixa_etaria: "adulto",
    idade_texto: "2 anos",
    descricao: "Brincalhão",
    url_foto: "https://exemplo.test/foto.jpg",
    created_at: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
};

/** Monta o encadeamento from().select().eq()...order()...range() do supabase-js. */
function mockQuery(result: { data: unknown; error: unknown }) {
  const calls = { select: [] as unknown[], eq: [] as unknown[][], order: [] as unknown[][], range: [] as unknown[] };
  const chain = {
    select: vi.fn((...args: unknown[]) => ((calls.select = args), chain)),
    eq: vi.fn((...args: unknown[]) => (calls.eq.push(args), chain)),
    order: vi.fn((...args: unknown[]) => (calls.order.push(args), chain)),
    range: vi.fn((...args: unknown[]) => ((calls.range = args), Promise.resolve(result))),
  };
  fakeDb.from.mockReturnValue(chain);
  return { calls };
}

const get = (query = "") => new NextRequest(`http://api.test/api/public/animais${query}`);

beforeEach(() => {
  seq = 0;
  vi.clearAllMocks();
  createSupabaseAnon.mockReturnValue(fakeDb);
});

describe("mapRowToPublicAnimal — só sai o que o contrato lista", () => {
  it("não deixa passar campos extras, nem os do adotante", () => {
    const sujo = {
      ...row(),
      adotante_nome: "Fulano de Tal",
      adotante_cep: "39800000",
      adotante_id: "x",
      lar_temporario_id: "y",
      data_adocao: "2026-01-01",
      status_adocao: "adotado",
    };
    const mapped = mapRowToPublicAnimal(sujo as PublicAnimalRow);
    expect(Object.keys(mapped).sort()).toEqual(
      ["descricao", "especie", "faixaEtaria", "id", "idadeTexto", "nome", "porte", "urlFoto"].sort(),
    );
    expect(JSON.stringify(mapped)).not.toMatch(/Fulano|39800000|adotante|lar_temporario|data_adocao/i);
  });

  it("espécie nula vira 'Outro' (o contrato não aceita nulo)", () => {
    expect(mapRowToPublicAnimal(row({ especie: null })).especie).toBe("Outro");
  });

  it("foto: só http(s); URL quebrada ou perigosa vira sem foto", () => {
    expect(mapRowToPublicAnimal(row({ url_foto: "https://x.test/a.jpg" })).urlFoto).toBe("https://x.test/a.jpg");
    expect(mapRowToPublicAnimal(row({ url_foto: "javascript:alert(1)" })).urlFoto).toBeNull();
    expect(mapRowToPublicAnimal(row({ url_foto: "data:text/html,<b>x</b>" })).urlFoto).toBeNull();
    expect(mapRowToPublicAnimal(row({ url_foto: "não é url" })).urlFoto).toBeNull();
    expect(mapRowToPublicAnimal(row({ url_foto: null })).urlFoto).toBeNull();
  });
});

describe("publicAnimalsQuerySchema — filtros em lista fechada", () => {
  it("padrões: limit 50 e offset 0", () => {
    expect(publicAnimalsQuerySchema.parse({})).toEqual({ limit: 50, offset: 0 });
  });

  it("aceita os filtros válidos e converte limit/offset de texto para número", () => {
    expect(
      publicAnimalsQuerySchema.parse({ especie: "Gato", porte: "G", idade: "filhote", limit: "10", offset: "20" }),
    ).toEqual({ especie: "Gato", porte: "G", idade: "filhote", limit: 10, offset: 20 });
  });

  it("recusa valor fora da lista e limite acima do teto", () => {
    expect(() => publicAnimalsQuerySchema.parse({ especie: "Dragão" })).toThrow();
    expect(() => publicAnimalsQuerySchema.parse({ porte: "GG" })).toThrow();
    expect(() => publicAnimalsQuerySchema.parse({ limit: "51" })).toThrow();
    expect(() => publicAnimalsQuerySchema.parse({ limit: "0" })).toThrow();
    expect(() => publicAnimalsQuerySchema.parse({ offset: "-1" })).toThrow();
  });

  it("parâmetro desconhecido é descartado (nunca vira filtro livre)", () => {
    const parsed = publicAnimalsQuerySchema.parse({ status_adocao: "adotado", adotante_nome: "x" });
    expect(parsed).toEqual({ limit: 50, offset: 0 });
  });
});

describe("PublicAnimalRepository", () => {
  it("lê só de animais, com colunas fixas, só disponíveis, ordenado e paginado", async () => {
    const { calls } = mockQuery({ data: [row()], error: null });
    await new PublicAnimalRepository(fakeDb as never).listAvailable({ limit: 50, offset: 0 });

    expect(fakeDb.from).toHaveBeenCalledWith("animais");
    const columns = String(calls.select[0]);
    expect(columns).not.toContain("*");
    expect(columns).not.toMatch(/adotante|lar_temporario|data_adocao|status_adocao/);
    expect(calls.eq).toContainEqual(["status_adocao", "disponivel"]);
    expect(calls.order).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: true }],
    ]);
    expect(calls.range).toEqual([0, 49]);
  });

  it("aplica os filtros e calcula o intervalo da página", async () => {
    const { calls } = mockQuery({ data: [], error: null });
    await new PublicAnimalRepository(fakeDb as never).listAvailable({
      especie: "Gato",
      porte: "P",
      idade: "idoso",
      limit: 10,
      offset: 20,
    });
    expect(calls.eq).toEqual(
      expect.arrayContaining([
        ["status_adocao", "disponivel"],
        ["especie", "Gato"],
        ["porte", "P"],
        ["faixa_etaria", "idoso"],
      ]),
    );
    expect(calls.range).toEqual([20, 29]);
  });

  it("erro do banco vira DatabaseError e data nula vira lista vazia", async () => {
    mockQuery({ data: null, error: { message: "boom" } });
    await expect(new PublicAnimalRepository(fakeDb as never).listAvailable({ limit: 50, offset: 0 })).rejects.toBeInstanceOf(
      DatabaseError,
    );
    mockQuery({ data: null, error: null });
    await expect(new PublicAnimalRepository(fakeDb as never).listAvailable({ limit: 50, offset: 0 })).resolves.toEqual([]);
  });
});

describe("GET /api/public/animais (controller)", () => {
  it("responde 200 sem login, no contrato público, sem cache de CDN e com o client anônimo", async () => {
    mockQuery({ data: [row({ nome: "Thor" }), row({ nome: "Mel", especie: "Gato" })], error: null });

    const response = await publicController.listAnimals(get());

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(publicAnimalListSchema.safeParse(body).success).toBe(true);
    expect(body.data.map((a: { nome: string }) => a.nome)).toEqual(["Thor", "Mel"]);

    expect(createSupabaseAnon).toHaveBeenCalledTimes(1);
    expect(requireUser).not.toHaveBeenCalled();
    expect(createSupabaseForUser).not.toHaveBeenCalled();
  });

  it("PRIVACIDADE: mesmo que o banco devolva dados do adotante, nada disso sai na resposta", async () => {
    const vazando = { ...row({ nome: "Thor" }), adotante_nome: "Maria Secreta", adotante_cep: "39800123", adotante_id: "a1", lar_temporario_id: "l1" };
    mockQuery({ data: [vazando], error: null });

    const response = await publicController.listAnimals(get());
    const texto = JSON.stringify(await response.json());

    expect(texto).not.toMatch(/Maria Secreta|39800123|adotante|larTemporario|lar_temporario|a1"|l1"/i);
  });

  it("repassa os filtros da URL para a consulta", async () => {
    const { calls } = mockQuery({ data: [], error: null });
    await publicController.listAnimals(get("?especie=Gato&porte=G&idade=filhote&limit=5&offset=10"));
    expect(calls.eq).toEqual(
      expect.arrayContaining([
        ["especie", "Gato"],
        ["porte", "G"],
        ["faixa_etaria", "filhote"],
      ]),
    );
    expect(calls.range).toEqual([10, 14]);
  });

  it("filtro inválido: 400, sem tocar no banco e sem cache", async () => {
    const response = await publicController.listAnimals(get("?porte=XL"));
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fakeDb.from).not.toHaveBeenCalled();
  });

  it("não deixa o chamador trocar o status: ?status_adocao=adotado é ignorado", async () => {
    const { calls } = mockQuery({ data: [], error: null });
    await publicController.listAnimals(get("?status_adocao=adotado"));
    expect(calls.eq).toContainEqual(["status_adocao", "disponivel"]);
    expect(calls.eq).not.toContainEqual(["status_adocao", "adotado"]);
  });

  it("falha do banco: 500 com mensagem genérica (sem detalhe interno)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery({ data: null, error: { message: "relation animais password=abc" } });

    const response = await publicController.listAnimals(get());

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const texto = JSON.stringify(await response.json());
    expect(texto).toBe(JSON.stringify({ error: "Erro ao acessar o banco de dados" }));
  });
});
