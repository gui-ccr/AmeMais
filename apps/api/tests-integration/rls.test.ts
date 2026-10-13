import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, clienteAnon, criarUsuario, type UsuarioDeTeste } from "./helpers";

/**
 * RLS de verdade, no Postgres do Supabase local. Os testes de unidade usam
 * repository falso e não pegam uma policy errada; estes pegam.
 */

type Cenario = { semPermissao: UsuarioDeTeste; leitura: UsuarioDeTeste; total: UsuarioDeTeste };

async function prepararCenario(modulo: string): Promise<Cenario & { limpar: () => Promise<void> }> {
  const [semPermissao, leitura, total] = await Promise.all([
    criarUsuario(modulo),
    criarUsuario(modulo, "leitura"),
    criarUsuario(modulo, "total"),
  ]);
  return {
    semPermissao,
    leitura,
    total,
    limpar: async () => {
      await Promise.all([semPermissao.limpar(), leitura.limpar(), total.limpar()]);
    },
  };
}

const novoLar = (nome: string) => ({
  nome_responsavel: nome,
  contato: "33999990000",
  capacidade: 2,
  status: "disponivel",
  endereco_regiao: "Centro",
});

describe("RLS: lares_temporarios (módulo lares)", () => {
  let c: Awaited<ReturnType<typeof prepararCenario>>;
  const criados: string[] = [];

  beforeAll(async () => {
    c = await prepararCenario("lares");
    const { data, error } = await admin.from("lares_temporarios").insert(novoLar("Lar da integração")).select("id").single();
    if (error) throw error;
    criados.push(data.id);
  });

  afterAll(async () => {
    if (criados.length) await admin.from("lares_temporarios").delete().in("id", criados);
    await c?.limpar();
  });

  it("anon não lê nenhum lar", async () => {
    const { data } = await clienteAnon().from("lares_temporarios").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("usuário sem permissão não lê nenhum lar", async () => {
    const { data, error } = await c.semPermissao.client.from("lares_temporarios").select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("usuário sem permissão não cria lar", async () => {
    const { error } = await c.semPermissao.client.from("lares_temporarios").insert(novoLar("Não pode"));
    expect(error).not.toBeNull();
  });

  it("usuário com leitura lista, mas não cria", async () => {
    const { data } = await c.leitura.client.from("lares_temporarios").select("id").in("id", criados);
    expect(data).toHaveLength(1);

    const { error } = await c.leitura.client.from("lares_temporarios").insert(novoLar("Não pode"));
    expect(error).not.toBeNull();
  });

  it("usuário com acesso total lista e cria", async () => {
    const { data: lista } = await c.total.client.from("lares_temporarios").select("id").in("id", criados);
    expect(lista).toHaveLength(1);

    const { data, error } = await c.total.client.from("lares_temporarios").insert(novoLar("Lar novo")).select("id").single();
    expect(error).toBeNull();
    criados.push(data!.id);
  });
});

describe("RLS: voluntarios (módulo voluntarios)", () => {
  let c: Awaited<ReturnType<typeof prepararCenario>>;
  let voluntarioId: string;

  beforeAll(async () => {
    c = await prepararCenario("voluntarios");
    const { data, error } = await admin
      .from("voluntarios")
      .insert({ nome: "Voluntário da integração", tipo: "apoio_geral" })
      .select("id")
      .single();
    if (error) throw error;
    voluntarioId = data.id;
  });

  afterAll(async () => {
    await admin.from("voluntarios").delete().ilike("nome", "%integração%");
    await c?.limpar();
  });

  it("anon não tem acesso à tabela (dados pessoais)", async () => {
    const { error } = await clienteAnon().from("voluntarios").select("id");
    expect(error?.code).toBe("42501");
  });

  it("usuário sem permissão não vê nenhuma linha", async () => {
    const { data } = await c.semPermissao.client.from("voluntarios").select("id");
    expect(data).toHaveLength(0);
  });

  it("usuário com leitura lê, mas não edita nem apaga", async () => {
    const { data } = await c.leitura.client.from("voluntarios").select("id").eq("id", voluntarioId);
    expect(data).toHaveLength(1);

    const { data: editados } = await c.leitura.client
      .from("voluntarios")
      .update({ bairro: "Hackeado" })
      .eq("id", voluntarioId)
      .select("id");
    expect(editados ?? []).toHaveLength(0);

    const { data: apagados } = await c.leitura.client.from("voluntarios").delete().eq("id", voluntarioId).select("id");
    expect(apagados ?? []).toHaveLength(0);
  });

  it("usuário com acesso total cria, edita e apaga", async () => {
    const { data: criado, error } = await c.total.client
      .from("voluntarios")
      .insert({ nome: "Outro da integração", tipo: "veterinario" })
      .select("id")
      .single();
    expect(error).toBeNull();

    const { data: editados } = await c.total.client
      .from("voluntarios")
      .update({ bairro: "Centro" })
      .eq("id", criado!.id)
      .select("id");
    expect(editados).toHaveLength(1);

    const { data: apagados } = await c.total.client.from("voluntarios").delete().eq("id", criado!.id).select("id");
    expect(apagados).toHaveLength(1);
  });
});

describe("RLS: animais vistos pelo site público (anon)", () => {
  const ids: string[] = [];

  beforeAll(async () => {
    const { data, error } = await admin
      .from("animais")
      .insert([
        { nome: "Disponível (integração)", especie: "Cachorro", status_adocao: "disponivel" },
        { nome: "Em tratamento (integração)", especie: "Gato", status_adocao: "em_tratamento" },
      ])
      .select("id");
    if (error) throw error;
    ids.push(...data.map((a) => a.id));
  });

  afterAll(async () => {
    await admin.from("animais").delete().in("id", ids);
  });

  it("anon só vê os animais disponíveis", async () => {
    const { data, error } = await clienteAnon().from("animais").select("id, status_adocao").in("id", ids);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: ids[0], status_adocao: "disponivel" }]);
  });

  it("anon não lê os dados do adotante", async () => {
    const { error } = await clienteAnon().from("animais").select("id, adotante_nome").in("id", ids);
    expect(error?.code).toBe("42501");
  });
});
