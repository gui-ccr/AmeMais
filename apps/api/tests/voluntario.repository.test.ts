import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { VoluntarioRepository, type ListVoluntariosFiltros } from "../src/features/voluntarios/voluntario.repository";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";
import { ConflictError, DatabaseError, ForbiddenError, NotFoundError } from "../src/core/errors";
import type { VoluntarioRow } from "../src/features/voluntarios/mapper";

type Call = { method: string; args: unknown[] };

/**
 * Dublê do query builder encadeável do supabase-js. Registra cada chamada
 * (`.eq`, `.contains`, `.or`, `.order`, `.range`...) pra provar os argumentos
 * exatos que iriam pro Postgres — não existe no projeto, até esta tarefa, um
 * teste de repository contra um Supabase real pra reaproveitar.
 */
function stubSupabase(finalResult: { data: unknown; error: unknown; count?: number | null }, rpcResult?: { data: unknown; error: unknown }) {
  const calls: Call[] = [];
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
    neq: (...args: unknown[]) => {
      calls.push({ method: "neq", args });
      return chain;
    },
    in: (...args: unknown[]) => {
      calls.push({ method: "in", args });
      return chain;
    },
    contains: (...args: unknown[]) => {
      calls.push({ method: "contains", args });
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
    ilike: (...args: unknown[]) => {
      calls.push({ method: "ilike", args });
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
    range: async (...args: unknown[]) => {
      calls.push({ method: "range", args });
      return finalResult;
    },
    // Não-terminal (ao contrário de range/single/maybeSingle): em
    // existsByEmail(), a chamada termina em .limit(n) sem mais nada depois,
    // então `chain` precisa ser "thenable" (ver `then` abaixo); em
    // findLarVinculado(), vem antes de .maybeSingle().
    limit: (...args: unknown[]) => {
      calls.push({ method: "limit", args });
      return chain;
    },
    single: async (...args: unknown[]) => {
      calls.push({ method: "single", args });
      return finalResult;
    },
    maybeSingle: async (...args: unknown[]) => {
      calls.push({ method: "maybeSingle", args });
      return finalResult;
    },
    rpc: async (...args: unknown[]) => {
      calls.push({ method: "rpc", args });
      return rpcResult ?? { data: true, error: null };
    },
    // Torna `chain` "thenable": um `await` direto no retorno de `.limit()`
    // (sem `.single()`/`.maybeSingle()` depois) resolve pra `finalResult`.
    then: (resolve: (value: typeof finalResult) => void) => resolve(finalResult),
  };
  return { client: chain as unknown as SupabaseClient, calls };
}

function rowFixture(overrides: Partial<VoluntarioRow> = {}): VoluntarioRow {
  return {
    id: "vol-1",
    nome: "Ana Silva",
    email: "ana@exemplo.com",
    telefone: "33998765432",
    tipo: "apoio_geral",
    bairro: "Centro",
    areas_de_ajuda: ["eventos"],
    status: "ativo",
    created_at: "2026-10-14T00:00:00.000Z",
    ...overrides,
  };
}

function filtrosBase(overrides: Partial<ListVoluntariosFiltros> = {}): ListVoluntariosFiltros {
  return { page: 1, limit: 20, ...overrides };
}

function creationDataFixture() {
  return Voluntario.create({
    nome: "Ana Silva",
    email: "ana@exemplo.com",
    telefone: "(33) 99876-5432",
    tipo: "apoio_geral",
    bairro: "Centro",
    areasDeAjuda: ["eventos"],
  });
}

describe("VoluntarioRepository.temAcessoDeLeitura()", () => {
  it("chama check_user_access com o slug 'voluntarios' e devolve true/false conforme o retorno", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null }, { data: true, error: null });
    const repository = new VoluntarioRepository(client);

    const temAcesso = await repository.temAcessoDeLeitura();

    expect(temAcesso).toBe(true);
    const rpcCall = calls.find((c) => c.method === "rpc");
    expect(rpcCall?.args).toEqual(["check_user_access", { modulo_slug: "voluntarios" }]);
  });

  it("devolve false quando a função SQL nega o acesso", async () => {
    const { client } = stubSupabase({ data: [], error: null }, { data: false, error: null });
    const repository = new VoluntarioRepository(client);

    expect(await repository.temAcessoDeLeitura()).toBe(false);
  });

  it("lança DatabaseError se a chamada RPC falhar (não interpreta erro como 'sem acesso')", async () => {
    const { client } = stubSupabase({ data: [], error: null }, { data: null, error: { message: "RPC quebrou" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.temAcessoDeLeitura()).rejects.toThrowError(DatabaseError);
  });
});

describe("VoluntarioRepository.list()", () => {
  it("lista sem filtros, ordenando por nome e usando o range padrão da página 1", async () => {
    const { client, calls } = stubSupabase({ data: [rowFixture()], error: null, count: 1 });
    const repository = new VoluntarioRepository(client);

    const resultado = await repository.list(filtrosBase());

    expect(resultado.items).toHaveLength(1);
    expect(resultado.total).toBe(1);
    expect(calls.filter((c) => c.method === "eq")).toHaveLength(0);
    expect(calls.filter((c) => c.method === "contains")).toHaveLength(0);
    expect(calls.filter((c) => c.method === "or")).toHaveLength(0);
    expect(calls.find((c) => c.method === "order")?.args).toEqual(["nome", { ascending: true }]);
    expect(calls.find((c) => c.method === "range")?.args).toEqual([0, 19]);
  });

  it("busca por nome, email ou telefone via .or() com as 3 colunas", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ busca: "Ana" }));

    const orCall = calls.find((c) => c.method === "or");
    expect(orCall?.args[0]).toBe("nome.ilike.%Ana%,email.ilike.%Ana%");
  });

  it("inclui telefone na busca só quando o termo tiver dígitos", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ busca: "33999990000" }));

    const orCall = calls.find((c) => c.method === "or");
    expect(orCall?.args[0]).toBe(
      "nome.ilike.%33999990000%,email.ilike.%33999990000%,telefone.ilike.%33999990000%",
    );
  });

  it("normaliza a máscara do telefone na busca antes de montar a cláusula", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ busca: "(33) 99999-0000" }));

    const orCall = calls.find((c) => c.method === "or");
    expect(orCall?.args[0]).toContain("telefone.ilike.%33999990000%");
  });

  it("não compara telefone quando o termo mistura letras e números ('ana 33' não traz todo DDD 33)", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ busca: "ana 33" }));

    expect(calls.find((c) => c.method === "or")?.args[0]).toBe("nome.ilike.%ana 33%,email.ilike.%ana 33%");
  });

  it("remove delimitadores do DSL do .or() e escapa wildcards do ilike no termo de busca", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ busca: "ana,(teste)%_" }));

    const orCall = calls.find((c) => c.method === "or");
    expect(orCall?.args[0]).toBe("nome.ilike.%anateste\\%\\_%,email.ilike.%anateste\\%\\_%");
  });

  it("escapa a própria barra invertida antes de % e _ no termo de busca", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ busca: "a\\%" }));

    expect(calls.find((c) => c.method === "or")?.args[0]).toBe("nome.ilike.%a\\\\\\%%,email.ilike.%a\\\\\\%%");
  });

  it("filtra por tipo", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ tipo: "veterinario" }));

    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["tipo", "veterinario"]);
  });

  it("filtra por status", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ status: "inativo" }));

    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["status", "inativo"]);
  });

  it("filtra por área usando .contains() na coluna areas_de_ajuda", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ area: "transporte" }));

    expect(calls.find((c) => c.method === "contains")?.args).toEqual(["areas_de_ajuda", ["transporte"]]);
  });

  it("combina busca + tipo + status + area na mesma consulta", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(
      filtrosBase({ busca: "Ana", tipo: "veterinario", status: "ativo", area: "transporte" }),
    );

    expect(calls.find((c) => c.method === "eq" && c.args[0] === "tipo")?.args).toEqual(["tipo", "veterinario"]);
    expect(calls.find((c) => c.method === "eq" && c.args[0] === "status")?.args).toEqual(["status", "ativo"]);
    expect(calls.find((c) => c.method === "contains")?.args).toEqual(["areas_de_ajuda", ["transporte"]]);
    expect(calls.find((c) => c.method === "or")?.args[0]).toBe("nome.ilike.%Ana%,email.ilike.%Ana%");
  });

  it("calcula o range da paginação a partir de page/limit (range é inclusivo nas duas pontas)", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase({ page: 3, limit: 10 }));

    expect(calls.find((c) => c.method === "range")?.args).toEqual([20, 29]);
  });

  it("devolve lista vazia e total 0 quando não há voluntários correspondentes", async () => {
    const { client } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    const resultado = await repository.list(filtrosBase());

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
  });

  it("página além do fim: devolve lista vazia, mas total continua refletindo os registros que existem", async () => {
    const { client } = stubSupabase({ data: [], error: null, count: 3 });
    const repository = new VoluntarioRepository(client);

    const resultado = await repository.list(filtrosBase({ page: 999, limit: 20 }));

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(3);
  });

  it("lança DatabaseError em caso de falha real de consulta, sem mascarar como lista vazia", async () => {
    const { client } = stubSupabase({ data: null, error: { message: "conexão perdida" }, count: null });
    const repository = new VoluntarioRepository(client);

    await expect(repository.list(filtrosBase())).rejects.toThrowError(DatabaseError);
  });

  it("usa o client recebido no construtor (o mesmo autenticado como o usuário) em toda chamada", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null, count: 0 });
    const repository = new VoluntarioRepository(client);

    await repository.list(filtrosBase());
    await repository.temAcessoDeLeitura();

    expect(calls.find((c) => c.method === "from")?.args).toEqual(["voluntarios"]);
    expect(calls.some((c) => c.method === "rpc")).toBe(true);
  });
});

describe("VoluntarioRepository.existsByEmail()", () => {
  it("devolve true quando a consulta encontra alguma linha", async () => {
    const { client } = stubSupabase({ data: [{ id: "vol-1" }], error: null });
    const repository = new VoluntarioRepository(client);

    expect(await repository.existsByEmail("ana@exemplo.com")).toBe(true);
  });

  it("devolve false quando a consulta não encontra nenhuma linha", async () => {
    const { client } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    expect(await repository.existsByEmail("ninguem@exemplo.com")).toBe(false);
  });

  it("usa ilike (sem diferenciar maiúsculas/minúsculas) no e-mail exato, sem adicionar % nas pontas", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    await repository.existsByEmail("Ana.Oliveira@Example.com");

    expect(calls.find((c) => c.method === "ilike")?.args).toEqual(["email", "Ana.Oliveira@Example.com"]);
  });

  it("escapa % e _ do e-mail antes de usá-los no ilike (não são wildcards aqui)", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    await repository.existsByEmail("ana_b%c@exemplo.com");

    expect(calls.find((c) => c.method === "ilike")?.args).toEqual(["email", "ana\\_b\\%c@exemplo.com"]);
  });

  it("escapa a barra invertida do e-mail antes de % e _", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    await repository.existsByEmail("a\\b@exemplo.com");

    expect(calls.find((c) => c.method === "ilike")?.args).toEqual(["email", "a\\\\b@exemplo.com"]);
  });

  it("lança DatabaseError se a consulta falhar", async () => {
    const { client } = stubSupabase({ data: null, error: { message: "conexão perdida" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.existsByEmail("ana@exemplo.com")).rejects.toThrowError(DatabaseError);
  });
});

describe("VoluntarioRepository.create()", () => {
  it("insere os dados já validados e devolve a entidade reconstruída da linha retornada", async () => {
    const row: VoluntarioRow = {
      id: "vol-1",
      nome: "Ana Silva",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "apoio_geral",
      bairro: "Centro",
      areas_de_ajuda: ["eventos"],
      status: "ativo",
      created_at: "2026-10-14T00:00:00.000Z",
    };
    const { client, calls } = stubSupabase({ data: row, error: null });
    const repository = new VoluntarioRepository(client);

    const voluntario = await repository.create(creationDataFixture());

    expect(voluntario.id).toBe("vol-1");
    expect(voluntario.telefone).toBe("33998765432");
    const insertCall = calls.find((c) => c.method === "insert");
    expect(insertCall?.args[0]).toEqual({
      nome: "Ana Silva",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "apoio_geral",
      bairro: "Centro",
      areas_de_ajuda: ["eventos"],
      status: "ativo",
    });
  });

  it("converte violação do índice único de e-mail (23505) em ConflictError, com mensagem clara", async () => {
    const { client } = stubSupabase({ data: null, error: { code: "23505", message: "duplicate key" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.create(creationDataFixture())).rejects.toThrowError(ConflictError);
    await expect(repository.create(creationDataFixture())).rejects.toThrowError(
      "Já existe um voluntário cadastrado com este e-mail.",
    );
  });

  it("converte violação de RLS (42501) em ForbiddenError, não em ConflictError", async () => {
    const { client } = stubSupabase({ data: null, error: { code: "42501", message: "rls" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.create(creationDataFixture())).rejects.toThrowError(ForbiddenError);
  });

  it("não mascara uma falha inesperada do banco como duplicidade", async () => {
    const { client } = stubSupabase({ data: null, error: { code: "53300", message: "too many connections" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.create(creationDataFixture())).rejects.toThrowError(DatabaseError);
    await expect(repository.create(creationDataFixture())).rejects.not.toThrowError(ConflictError);
  });
});

describe("VoluntarioRepository.findById()", () => {
  it("devolve a entidade quando o id existe", async () => {
    const { client, calls } = stubSupabase({ data: rowFixture(), error: null });
    const repository = new VoluntarioRepository(client);

    const voluntario = await repository.findById("vol-1");

    expect(voluntario.id).toBe("vol-1");
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["id", "vol-1"]);
  });

  it("lança NotFoundError quando o id não existe (sem linha, sem erro explícito)", async () => {
    const { client } = stubSupabase({ data: null, error: null });
    const repository = new VoluntarioRepository(client);

    await expect(repository.findById("inexistente")).rejects.toThrowError(NotFoundError);
  });

  it("lança DatabaseError (não NotFoundError) quando o Supabase devolve um erro real", async () => {
    const { client } = stubSupabase({ data: null, error: { message: "conexão perdida" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.findById("vol-1")).rejects.toThrowError(DatabaseError);
  });
});

describe("VoluntarioRepository.findLarVinculado()", () => {
  it("devolve id e enderecoRegiao quando há um lar vinculado", async () => {
    const { client, calls } = stubSupabase({
      data: { id: "lar-1", endereco_regiao: "Zona Norte" },
      error: null,
    });
    const repository = new VoluntarioRepository(client);

    const lar = await repository.findLarVinculado("vol-1");

    expect(lar).toEqual({ id: "lar-1", enderecoRegiao: "Zona Norte" });
    expect(calls.find((c) => c.method === "from")?.args).toEqual(["lares_temporarios"]);
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["voluntario_id", "vol-1"]);
    expect(calls.find((c) => c.method === "limit")?.args).toEqual([1]);
  });

  it("devolve null quando não há lar vinculado", async () => {
    const { client } = stubSupabase({ data: null, error: null });
    const repository = new VoluntarioRepository(client);

    expect(await repository.findLarVinculado("vol-1")).toBeNull();
  });

  it("escolhe o lar mais antigo de forma determinística, caso exista mais de um vínculo (sem constraint de unicidade no banco)", async () => {
    const { client, calls } = stubSupabase({ data: { id: "lar-mais-antigo", endereco_regiao: "Centro" }, error: null });
    const repository = new VoluntarioRepository(client);

    await repository.findLarVinculado("vol-1");

    expect(calls.find((c) => c.method === "order")?.args).toEqual(["created_at", { ascending: true }]);
  });

  it("lança DatabaseError em falha de consulta, nunca interpreta como 'sem lar'", async () => {
    const { client } = stubSupabase({ data: null, error: { message: "conexão perdida" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.findLarVinculado("vol-1")).rejects.toThrowError(DatabaseError);
  });
});

describe("VoluntarioRepository.existsByEmail() com excludingId (KAN-84)", () => {
  it("exclui o próprio id da busca quando excludingId é informado", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    await repository.existsByEmail("ana@exemplo.com", "vol-1");

    expect(calls.find((c) => c.method === "neq")?.args).toEqual(["id", "vol-1"]);
  });

  it("sem excludingId, não chama .neq() (comportamento do cadastro, inalterado)", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    await repository.existsByEmail("ana@exemplo.com");

    expect(calls.some((c) => c.method === "neq")).toBe(false);
  });

  it("Caso A do ticket: encontra só o próprio registro -> false ao excluí-lo", async () => {
    const { client } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    expect(await repository.existsByEmail("ana@exemplo.com", "vol-1")).toBe(false);
  });

  it("Caso C do ticket: encontra outro registro -> true mesmo excluindo o próprio id", async () => {
    const { client } = stubSupabase({ data: [{ id: "vol-2" }], error: null });
    const repository = new VoluntarioRepository(client);

    expect(await repository.existsByEmail("ana@exemplo.com", "vol-1")).toBe(true);
  });
});

describe("VoluntarioRepository.update()", () => {
  function voluntarioParaAtualizar() {
    const voluntario = Voluntario.restore({
      id: "vol-1",
      createdAt: "2026-10-14T00:00:00.000Z",
      ...creationDataFixture(),
    });
    voluntario.update({
      nome: "Ana Silva Atualizada",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "veterinario",
      bairro: "Novo Bairro",
      areasDeAjuda: ["transporte"],
    });
    return voluntario;
  }

  it("grava só os campos editáveis (nunca status) e devolve a entidade atualizada", async () => {
    const row: VoluntarioRow = {
      id: "vol-1",
      nome: "Ana Silva Atualizada",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "veterinario",
      bairro: "Novo Bairro",
      areas_de_ajuda: ["transporte"],
      status: "ativo",
      created_at: "2026-10-14T00:00:00.000Z",
    };
    const { client, calls } = stubSupabase({ data: row, error: null });
    const repository = new VoluntarioRepository(client);

    const atualizado = await repository.update("vol-1", voluntarioParaAtualizar());

    expect(atualizado.nome).toBe("Ana Silva Atualizada");
    const updateCall = calls.find((c) => c.method === "update");
    expect(updateCall?.args[0]).toEqual({
      nome: "Ana Silva Atualizada",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "veterinario",
      bairro: "Novo Bairro",
      areas_de_ajuda: ["transporte"],
    });
    expect(updateCall?.args[0]).not.toHaveProperty("status");
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["id", "vol-1"]);
  });

  it("converte violação do índice único de e-mail (23505) em ConflictError", async () => {
    const { client } = stubSupabase({ data: null, error: { code: "23505", message: "duplicate key" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.update("vol-1", voluntarioParaAtualizar())).rejects.toThrowError(ConflictError);
  });

  it("converte violação de RLS (42501) em ForbiddenError", async () => {
    const { client } = stubSupabase({ data: null, error: { code: "42501", message: "rls" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.update("vol-1", voluntarioParaAtualizar())).rejects.toThrowError(ForbiddenError);
  });

  it("lança ForbiddenError quando o UPDATE afeta 0 linhas (filtrado pela RLS, ex.: nível 'leitura'), não 500", async () => {
    const { client, calls } = stubSupabase({ data: null, error: null });
    const repository = new VoluntarioRepository(client);

    await expect(repository.update("vol-1", voluntarioParaAtualizar())).rejects.toThrowError(ForbiddenError);
    expect(calls.some((c) => c.method === "maybeSingle")).toBe(true);
    expect(calls.some((c) => c.method === "single")).toBe(false);
  });
});

describe("VoluntarioRepository.findLaresVinculados()", () => {
  it("lista vazia de ids -> Map vazio, sem consultar o banco", async () => {
    const { client, calls } = stubSupabase({ data: [], error: null });
    const repository = new VoluntarioRepository(client);

    expect((await repository.findLaresVinculados([])).size).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("busca os lares de todos os ids numa consulta só e fica com o primeiro lar (mais antigo) de cada voluntário", async () => {
    const { client, calls } = stubSupabase({
      data: [
        { id: "lar-1", endereco_regiao: "Centro", voluntario_id: "vol-1" },
        { id: "lar-2", endereco_regiao: "Zona Norte", voluntario_id: "vol-1" },
        { id: "lar-3", endereco_regiao: "Zona Sul", voluntario_id: "vol-2" },
      ],
      error: null,
    });
    const repository = new VoluntarioRepository(client);

    const lares = await repository.findLaresVinculados(["vol-1", "vol-2", "vol-3"]);

    expect(calls.find((c) => c.method === "from")?.args).toEqual(["lares_temporarios"]);
    expect(calls.find((c) => c.method === "in")?.args).toEqual(["voluntario_id", ["vol-1", "vol-2", "vol-3"]]);
    expect(calls.find((c) => c.method === "order")?.args).toEqual(["created_at", { ascending: true }]);
    expect(lares.get("vol-1")).toEqual({ id: "lar-1", enderecoRegiao: "Centro" });
    expect(lares.get("vol-2")).toEqual({ id: "lar-3", enderecoRegiao: "Zona Sul" });
    expect(lares.has("vol-3")).toBe(false);
  });

  it("lança DatabaseError se a consulta falhar", async () => {
    const { client } = stubSupabase({ data: null, error: { message: "falhou" } });
    const repository = new VoluntarioRepository(client);

    await expect(repository.findLaresVinculados(["vol-1"])).rejects.toThrowError(DatabaseError);
  });
});
