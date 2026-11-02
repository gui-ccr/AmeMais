import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ShelterRepository, type ListSheltersFiltros } from "../src/features/lares/shelter.repository";
import { DatabaseError } from "../src/core/errors";
import type { ShelterRow } from "../src/features/lares/mapper";

type Call = { method: string; args: unknown[] };

/**
 * Dublê do query builder encadeável do supabase-js. Cada chamada a `.from()`
 * recebe a próxima resposta da fila `respostas` (na ordem em que o código do
 * repository as consome) — necessário porque `list()` pode consultar duas
 * tabelas diferentes (a view de ocupação e `lares_temporarios`) na mesma
 * chamada.
 */
function stubSupabase(respostas: Array<{ data: unknown; error: unknown; count?: number | null }>) {
  const calls: Call[] = [];
  let indice = 0;

  function proximaResposta() {
    const resposta = respostas[Math.min(indice, respostas.length - 1)];
    indice += 1;
    return resposta;
  }

  const chain = {
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return chain;
    },
    select: (...args: unknown[]) => {
      calls.push({ method: "select", args });
      return chain;
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: "eq", args });
      return chain;
    },
    gt: (...args: unknown[]) => {
      calls.push({ method: "gt", args });
      return chain;
    },
    in: (...args: unknown[]) => {
      calls.push({ method: "in", args });
      return chain;
    },
    or: (...args: unknown[]) => {
      calls.push({ method: "or", args });
      return chain;
    },
    order: (...args: unknown[]) => {
      calls.push({ method: "order", args });
      return chain;
    },
    insert: (...args: unknown[]) => {
      calls.push({ method: "insert", args });
      return chain;
    },
    update: (...args: unknown[]) => {
      calls.push({ method: "update", args });
      return chain;
    },
    single: async (...args: unknown[]) => {
      calls.push({ method: "single", args });
      return proximaResposta();
    },
    range: async (...args: unknown[]) => {
      calls.push({ method: "range", args });
      return proximaResposta();
    },
    then: (resolve: (value: unknown) => void) => {
      calls.push({ method: "(await sem .range/.single)", args: [] });
      resolve(proximaResposta());
    },
  };

  return { client: chain as unknown as SupabaseClient, calls };
}

function rowFixture(overrides: Partial<ShelterRow> = {}): ShelterRow {
  return {
    id: "lar-1",
    nome_responsavel: "Maria Silva",
    contato: "33999990000",
    capacidade: 5,
    status: "disponivel",
    endereco_regiao: "Centro",
    aceita_gatos: false,
    aceita_cachorros: false,
    observacoes: null,
    voluntario_id: null,
    is_active: true,
    created_at: "2026-10-14T00:00:00.000Z",
    ...overrides,
  };
}

function filtrosBase(overrides: Partial<ListSheltersFiltros> = {}): ListSheltersFiltros {
  return { limit: 20, offset: 0, ...overrides };
}

describe("ShelterRepository.list() — sem comVagas", () => {
  it("lista sem filtros, ordenando por created_at desc + id (estável) e usando o range padrão", async () => {
    const { client, calls } = stubSupabase([
      { data: [rowFixture()], error: null, count: 1 }, // lares_temporarios
      { data: [{ id: "lar-1", ocupacao: 2, vagas: 3 }], error: null }, // view (enriquecimento)
    ]);
    const repository = new ShelterRepository(client);

    const resultado = await repository.list(filtrosBase());

    expect(resultado.total).toBe(1);
    expect(resultado.items).toEqual([{ shelter: expect.anything(), ocupacao: 2, vagas: 3 }]);
    expect(calls.find((c) => c.method === "from")?.args).toEqual(["lares_temporarios"]);
    expect(calls.filter((c) => c.method === "order").map((c) => c.args)).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: true }],
    ]);
    expect(calls.find((c) => c.method === "range")?.args).toEqual([0, 19]);
  });

  it("filtra por status", async () => {
    const { client, calls } = stubSupabase([
      { data: [], error: null, count: 0 },
      { data: [], error: null },
    ]);
    const repository = new ShelterRepository(client);

    await repository.list(filtrosBase({ status: "ocupado" }));

    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["status", "ocupado"]);
  });

  it("busca por nome do responsável OU região via .or()", async () => {
    const { client, calls } = stubSupabase([
      { data: [], error: null, count: 0 },
      { data: [], error: null },
    ]);
    const repository = new ShelterRepository(client);

    await repository.list(filtrosBase({ busca: "Centro" }));

    expect(calls.find((c) => c.method === "or")?.args[0]).toBe(
      "nome_responsavel.ilike.%Centro%,endereco_regiao.ilike.%Centro%",
    );
  });

  it("escapa delimitadores do .or() e wildcards do ilike no termo de busca", async () => {
    const { client, calls } = stubSupabase([
      { data: [], error: null, count: 0 },
      { data: [], error: null },
    ]);
    const repository = new ShelterRepository(client);

    // "a,(b)%_c" -> remove , ( ) -> "ab%_c" -> escapa % e _ -> "ab\%\_c"
    await repository.list(filtrosBase({ busca: "a,(b)%_c" }));

    expect(calls.find((c) => c.method === "or")?.args[0]).toBe(
      "nome_responsavel.ilike.%ab\\%\\_c%,endereco_regiao.ilike.%ab\\%\\_c%",
    );
  });

  it("combina status + busca na mesma consulta", async () => {
    const { client, calls } = stubSupabase([
      { data: [], error: null, count: 0 },
      { data: [], error: null },
    ]);
    const repository = new ShelterRepository(client);

    await repository.list(filtrosBase({ status: "disponivel", busca: "Centro" }));

    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["status", "disponivel"]);
    expect(calls.find((c) => c.method === "or")?.args[0]).toBe(
      "nome_responsavel.ilike.%Centro%,endereco_regiao.ilike.%Centro%",
    );
  });

  it("calcula o range a partir de limit/offset (range é inclusivo nas duas pontas)", async () => {
    const { client, calls } = stubSupabase([
      { data: [], error: null, count: 0 },
      { data: [], error: null },
    ]);
    const repository = new ShelterRepository(client);

    await repository.list(filtrosBase({ limit: 10, offset: 30 }));

    expect(calls.find((c) => c.method === "range")?.args).toEqual([30, 39]);
  });

  it("devolve lista vazia e total 0 quando não há lares correspondentes", async () => {
    const { client } = stubSupabase([
      { data: [], error: null, count: 0 },
      { data: [], error: null },
    ]);
    const repository = new ShelterRepository(client);

    const resultado = await repository.list(filtrosBase({ busca: "Nenhum lar tem esse nome" }));

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
  });

  it("página além do fim: lista vazia, mas total reflete os registros que existem", async () => {
    const { client } = stubSupabase([
      { data: [], error: null, count: 3 },
      { data: [], error: null },
    ]);
    const repository = new ShelterRepository(client);

    const resultado = await repository.list(filtrosBase({ offset: 999 }));

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(3);
  });

  it("busca ocupacao/vagas na view só para os ids da página (não a tabela inteira)", async () => {
    const { client, calls } = stubSupabase([
      { data: [rowFixture({ id: "lar-1" }), rowFixture({ id: "lar-2" })], error: null, count: 2 },
      { data: [{ id: "lar-1", ocupacao: 1, vagas: 4 }, { id: "lar-2", ocupacao: 0, vagas: 5 }], error: null },
    ]);
    const repository = new ShelterRepository(client);

    const resultado = await repository.list(filtrosBase());

    const inCall = calls.find((c) => c.method === "in");
    expect(inCall?.args).toEqual(["id", ["lar-1", "lar-2"]]);
    expect(resultado.items.map((i) => ({ id: i.shelter.id, ocupacao: i.ocupacao, vagas: i.vagas }))).toEqual([
      { id: "lar-1", ocupacao: 1, vagas: 4 },
      { id: "lar-2", ocupacao: 0, vagas: 5 },
    ]);
  });

  it("lança DatabaseError em falha de consulta, sem mascarar como lista vazia", async () => {
    const { client } = stubSupabase([{ data: null, error: { message: "conexão perdida" }, count: null }]);
    const repository = new ShelterRepository(client);

    await expect(repository.list(filtrosBase())).rejects.toThrowError(DatabaseError);
  });
});

describe("ShelterRepository.list() — comVagas", () => {
  it("comVagas=true: filtra por vagas > 0 na view ANTES da paginação, e reaproveita a ocupação já obtida", async () => {
    const { client, calls } = stubSupabase([
      { data: [{ id: "lar-1", ocupacao: 1, vagas: 4 }], error: null }, // view: ids com vaga
      { data: [rowFixture({ id: "lar-1" })], error: null, count: 1 }, // lares_temporarios filtrado por esses ids
    ]);
    const repository = new ShelterRepository(client);

    const resultado = await repository.list(filtrosBase({ comVagas: true }));

    expect(calls.find((c) => c.method === "gt")?.args).toEqual(["vagas", 0]);
    const inCall = calls.find((c) => c.method === "in");
    expect(inCall?.args).toEqual(["id", ["lar-1"]]);
    expect(resultado.items).toEqual([{ shelter: expect.anything(), ocupacao: 1, vagas: 4 }]);
    // Não deveria haver uma SEGUNDA consulta à view para reobter a ocupação:
    // só as 2 chamadas acima (.gt na view, depois a tabela principal).
    expect(calls.filter((c) => c.method === "from").map((c) => c.args)).toEqual([
      ["lares_com_ocupacao"],
      ["lares_temporarios"],
    ]);
  });

  it("comVagas=true: devolve lista vazia sem consultar lares_temporarios quando nenhum lar tem vaga", async () => {
    const { client, calls } = stubSupabase([{ data: [], error: null }]);
    const repository = new ShelterRepository(client);

    const resultado = await repository.list(filtrosBase({ comVagas: true }));

    expect(resultado).toEqual({ items: [], total: 0 });
    expect(calls.some((c) => c.method === "from" && c.args[0] === "lares_temporarios")).toBe(false);
  });

  it("comVagas=false não restringe a lista (lares sem vaga também aparecem)", async () => {
    const { client, calls } = stubSupabase([
      { data: [rowFixture()], error: null, count: 1 },
      { data: [{ id: "lar-1", ocupacao: 5, vagas: 0 }], error: null },
    ]);
    const repository = new ShelterRepository(client);

    await repository.list(filtrosBase({ comVagas: false }));

    expect(calls.some((c) => c.method === "gt")).toBe(false);
    expect(calls.some((c) => c.method === "from" && c.args[0] === "lares_com_ocupacao" && calls.indexOf(c) === 0)).toBe(
      false,
    );
  });

  it("comVagas ausente não restringe a lista, igual a comVagas=false", async () => {
    const { client, calls } = stubSupabase([
      { data: [rowFixture()], error: null, count: 1 },
      { data: [{ id: "lar-1", ocupacao: 0, vagas: 5 }], error: null },
    ]);
    const repository = new ShelterRepository(client);

    await repository.list(filtrosBase());

    expect(calls.some((c) => c.method === "gt")).toBe(false);
  });

  it("combina status + busca + comVagas na mesma consulta", async () => {
    const { client, calls } = stubSupabase([
      { data: [{ id: "lar-1", ocupacao: 0, vagas: 5 }], error: null },
      { data: [rowFixture({ id: "lar-1" })], error: null, count: 1 },
    ]);
    const repository = new ShelterRepository(client);

    await repository.list(filtrosBase({ status: "disponivel", busca: "Centro", comVagas: true }));

    expect(calls.find((c) => c.method === "gt")?.args).toEqual(["vagas", 0]);
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["status", "disponivel"]);
    expect(calls.find((c) => c.method === "or")?.args[0]).toBe(
      "nome_responsavel.ilike.%Centro%,endereco_regiao.ilike.%Centro%",
    );
    expect(calls.find((c) => c.method === "in")?.args).toEqual(["id", ["lar-1"]]);
  });
});
