import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, clienteAnon, criarUsuario, type UsuarioDeTeste } from "./helpers";

/** RLS, trigger de auditoria e Storage de `doacoes` no Postgres do Supabase local. */

const novaDoacao = {
  descricao: "Ração de teste",
  quantidade: 10,
  unidade: "kg",
  categoria: "racao",
  local_coleta: "Pet Shop",
  data_entrada: "2026-11-01",
};

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

describe("RLS: doacoes (módulo doacoes)", () => {
  let semPermissao: Awaited<ReturnType<typeof criarUsuario>>;
  let leitura: Awaited<ReturnType<typeof criarUsuario>>;
  let total: Awaited<ReturnType<typeof criarUsuario>>;
  const criadas: string[] = [];
  const arquivos: string[] = [];
  let existente: string;

  beforeAll(async () => {
    [semPermissao, leitura, total] = await Promise.all([
      criarUsuario("doacoes"),
      criarUsuario("doacoes", "leitura"),
      criarUsuario("doacoes", "total"),
    ]);
    const { data, error } = await admin.from("doacoes").insert(novaDoacao).select("id").single();
    if (error) throw error;
    existente = data.id;
    criadas.push(existente);
  });

  afterAll(async () => {
    if (criadas.length) await admin.from("doacoes").delete().in("id", criadas);
    if (arquivos.length) await admin.storage.from("animal-photos").remove(arquivos);
    await Promise.all([semPermissao?.limpar(), leitura?.limpar(), total?.limpar()]);
  });

  const lerComo = (u: UsuarioDeTeste) => u.client.from("doacoes").select("id").eq("id", existente);

  it("anon e usuário sem permissão não leem", async () => {
    expect((await clienteAnon().from("doacoes").select("id")).data ?? []).toHaveLength(0);
    expect((await lerComo(semPermissao)).data).toHaveLength(0);
  });

  it("leitura lê mas não escreve", async () => {
    expect((await lerComo(leitura)).data).toHaveLength(1);
    expect((await leitura.client.from("doacoes").insert(novaDoacao)).error?.code).toBe("42501");
    const { data } = await leitura.client.from("doacoes").update({ descricao: "x" }).eq("id", existente).select("id");
    expect(data).toHaveLength(0);
    const apagado = await leitura.client.from("doacoes").delete().eq("id", existente).select("id");
    expect(apagado.data).toHaveLength(0);
  });

  it("total cria com registrado_por do usuário autenticado, ignorando o que o cliente enviar", async () => {
    const { data, error } = await total.client
      .from("doacoes")
      .insert({ ...novaDoacao, registrado_por_nome: "Hacker", registrado_por_id: semPermissao.id })
      .select("id, registrado_por_id, registrado_por_nome")
      .single();
    expect(error).toBeNull();
    criadas.push(data!.id);
    expect(data!.registrado_por_id).toBe(total.id);
    expect(data!.registrado_por_nome).toMatch(/^Integração /);
  });

  it("total edita sem alterar a auditoria", async () => {
    const { data, error } = await total.client
      .from("doacoes")
      .update({ quantidade: 20, registrado_por_nome: "Outro" })
      .eq("id", existente)
      .select("quantidade, registrado_por_nome")
      .single();
    expect(error).toBeNull();
    expect(data!.quantidade).toBe(20);
    expect(data!.registrado_por_nome).not.toBe("Outro");
  });

  it("recusa quantidade não positiva e unidade desconhecida", async () => {
    expect((await total.client.from("doacoes").insert({ ...novaDoacao, quantidade: 0 })).error).not.toBeNull();
    expect((await total.client.from("doacoes").insert({ ...novaDoacao, unidade: "m" })).error).not.toBeNull();
  });

  it("total apaga", async () => {
    const { data: nova } = await admin.from("doacoes").insert(novaDoacao).select("id").single();
    const { data } = await total.client.from("doacoes").delete().eq("id", nova!.id).select("id");
    expect(data).toHaveLength(1);
  });

  it("Storage: só 'total' sobe foto em doacoes/", async () => {
    const caminho = `doacoes/integracao-${Date.now()}.jpg`;
    const negado = await leitura.client.storage.from("animal-photos").upload(caminho, JPEG, { contentType: "image/jpeg" });
    expect(negado.error).not.toBeNull();

    const ok = await total.client.storage.from("animal-photos").upload(caminho, JPEG, { contentType: "image/jpeg" });
    expect(ok.error).toBeNull();
    arquivos.push(caminho);
  });
});
