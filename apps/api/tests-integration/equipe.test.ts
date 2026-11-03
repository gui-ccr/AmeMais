import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, clienteAnon, criarUsuario, type UsuarioDeTeste } from "./helpers";

/**
 * Funções `equipe_*` (migration 20261103120000) no Postgres do Supabase local: permissão
 * admin/total e regras anti-trava de verdade. O banco local tem outros administradores (seed),
 * por isso "último administrador" é testado pelo contador `equipe_admins_ativos`.
 */

type Cenario = { semAdmin: UsuarioDeTeste; adminA: UsuarioDeTeste; adminB: UsuarioDeTeste };

async function departamentoDe(usuarioId: string): Promise<string[]> {
  const { data } = await admin.from("usuario_departamentos").select("departamento_id").eq("usuario_id", usuarioId);
  return (data ?? []).map((l) => l.departamento_id as string).sort();
}

/** O departamento criado pelo helper para o usuário (o gatilho também o põe em "Voluntariado"). */
async function departamentoDoTeste(usuarioId: string): Promise<string> {
  const { data } = await admin
    .from("usuario_departamentos")
    .select("departamento_id, departamentos!inner(nome)")
    .eq("usuario_id", usuarioId)
    .like("departamentos.nome", "Integração %");
  return (data![0] as { departamento_id: string }).departamento_id;
}

async function adminsAtivos(): Promise<string[]> {
  const { data, error } = await admin.rpc("equipe_admins_ativos");
  if (error) throw error;
  return data as string[];
}

describe("RPC equipe_*: acesso e anti-trava", () => {
  let c: Cenario;
  let limpezas: (() => Promise<void>)[] = [];
  const departamentosCriados: string[] = [];

  beforeAll(async () => {
    const [semAdmin, adminA, adminB] = await Promise.all([
      criarUsuario("admin", "leitura"),
      criarUsuario("admin", "total"),
      criarUsuario("admin", "total"),
    ]);
    c = { semAdmin, adminA, adminB };
    limpezas = [semAdmin.limpar, adminA.limpar, adminB.limpar];
  });

  afterAll(async () => {
    if (departamentosCriados.length) await admin.from("departamentos").delete().in("id", departamentosCriados);
    await Promise.all(limpezas.map((limpar) => limpar()));
  });

  it("anon e usuário sem admin/total (nem com admin/leitura) levam 42501 em todas as funções", async () => {
    const id = randomUUID();
    const chamadas = [
      c.semAdmin.client.rpc("equipe_listar_membros"),
      c.semAdmin.client.rpc("equipe_listar_departamentos"),
      c.semAdmin.client.rpc("equipe_autorizar"),
      c.semAdmin.client.rpc("equipe_autorizar_acao_sobre_conta", { p_usuario_id: c.adminA.id, p_acao: "ativar" }),
      c.semAdmin.client.rpc("equipe_definir_departamentos_do_membro", { p_usuario_id: c.semAdmin.id, p_departamento_ids: [] }),
      c.semAdmin.client.rpc("equipe_criar_departamento", { p_nome: "Invasor" }),
      c.semAdmin.client.rpc("equipe_atualizar_departamento", { p_id: id, p_nome: "Invasor" }),
      c.semAdmin.client.rpc("equipe_salvar_matriz_do_departamento", { p_departamento_id: id, p_permissoes: [] }),
      c.semAdmin.client.rpc("equipe_remover_departamento", { p_id: id }),
    ];
    for (const resposta of await Promise.all(chamadas)) {
      expect(resposta.error?.code).toBe("42501");
    }
    const { data } = await admin.from("departamentos").select("id").eq("nome", "Invasor");
    expect(data).toHaveLength(0);
  });

  it("as funções auxiliares internas não são chamáveis por usuário logado", async () => {
    const { error } = await c.adminA.client.rpc("equipe_admins_ativos");
    expect(error).not.toBeNull();
    const { error: erroTrava } = await c.adminA.client.rpc("equipe_conferir_anti_trava");
    expect(erroTrava).not.toBeNull();
  });

  it("admin lista membros (com busca) e departamentos com a matriz completa", async () => {
    const { data: membros, error } = await c.adminA.client.rpc("equipe_listar_membros", { p_busca: "integracao-" });
    expect(error).toBeNull();
    expect((membros as { id: string }[]).map((m) => m.id)).toContain(c.adminB.id);
    expect(Object.keys((membros as object[])[0]!)).not.toContain("senha");

    const { data: dados } = await c.adminA.client.rpc("equipe_listar_departamentos");
    const { modulos, departamentos } = dados as { modulos: { id: string }[]; departamentos: { permissoes: unknown[] }[] };
    expect(modulos.length).toBeGreaterThan(0);
    expect(departamentos.every((d) => d.permissoes.length === modulos.length)).toBe(true);
  });

  it("anti-trava (a): não desativa nem redefine a senha da própria conta", async () => {
    const desativar = await c.adminA.client.rpc("equipe_autorizar_acao_sobre_conta", { p_usuario_id: c.adminA.id, p_acao: "desativar" });
    expect(desativar.error?.code).toBe("EQ409");
    const senha = await c.adminA.client.rpc("equipe_autorizar_acao_sobre_conta", { p_usuario_id: c.adminA.id, p_acao: "redefinir_senha" });
    expect(senha.error?.code).toBe("EQ409");
    const outro = await c.adminA.client.rpc("equipe_autorizar_acao_sobre_conta", { p_usuario_id: c.adminB.id, p_acao: "desativar" });
    expect(outro.error).toBeNull();
  });

  it("anti-trava (b): não tira de si o admin/total trocando os próprios departamentos (nada muda)", async () => {
    const antes = await departamentoDe(c.adminA.id);
    const { error } = await c.adminA.client.rpc("equipe_definir_departamentos_do_membro", {
      p_usuario_id: c.adminA.id,
      p_departamento_ids: [],
    });
    expect(error?.code).toBe("EQ409");
    expect(await departamentoDe(c.adminA.id)).toEqual(antes);
  });

  it("anti-trava (b): não tira o admin da matriz do próprio departamento (matriz preservada)", async () => {
    const depId = await departamentoDoTeste(c.adminA.id);
    const { data: modulos } = await admin.from("modulos").select("id, slug");
    const moduloAdmin = modulos!.find((m) => m.slug === "admin")!;

    for (const nivel of [null, "leitura"]) {
      const { error } = await c.adminA.client.rpc("equipe_salvar_matriz_do_departamento", {
        p_departamento_id: depId,
        p_permissoes: [{ moduloId: moduloAdmin.id, nivel }],
      });
      expect(error?.code).toBe("EQ409");
    }
    const { data } = await admin.from("departamento_modulos").select("nivel_acesso").eq("departamento_id", depId).eq("modulo_id", moduloAdmin.id);
    expect(data).toEqual([{ nivel_acesso: "total" }]);
  });

  it("anti-trava: apagar o departamento que dá o próprio admin é recusado (tem membro)", async () => {
    const depId = await departamentoDoTeste(c.adminA.id);
    const { error } = await c.adminA.client.rpc("equipe_remover_departamento", { p_id: depId });
    expect(error?.code).toBe("EQ409");
  });

  it("admin pode mexer nos departamentos de OUTRO admin (sobra ele mesmo ativo)", async () => {
    const antes = await departamentoDe(c.adminB.id);
    const { error } = await c.adminA.client.rpc("equipe_definir_departamentos_do_membro", {
      p_usuario_id: c.adminB.id,
      p_departamento_ids: [],
    });
    expect(error).toBeNull();
    expect(await departamentoDe(c.adminB.id)).toEqual([]);
    // devolve para a limpeza do helper funcionar do jeito normal
    await c.adminA.client.rpc("equipe_definir_departamentos_do_membro", { p_usuario_id: c.adminB.id, p_departamento_ids: antes });
  });

  it("anti-trava (c): o contador de admins ativos ignora quem foi desativado no Auth", async () => {
    expect(await adminsAtivos()).toContain(c.adminB.id);

    await admin.auth.admin.updateUserById(c.adminB.id, { ban_duration: "876000h" });
    expect(await adminsAtivos()).not.toContain(c.adminB.id);
    expect(await adminsAtivos()).toContain(c.adminA.id);

    const { data: membros } = await c.adminA.client.rpc("equipe_listar_membros", { p_busca: c.adminB.id.slice(0, 0) || "integracao-" });
    expect((membros as { id: string; ativo: boolean }[]).find((m) => m.id === c.adminB.id)?.ativo).toBe(false);

    await admin.auth.admin.updateUserById(c.adminB.id, { ban_duration: "none" });
    expect(await adminsAtivos()).toContain(c.adminB.id);
  });

  it("departamentos: criar, nome repetido (409), renomear, matriz atômica e apagar sem membros", async () => {
    const nome = `Teste ${randomUUID().slice(0, 8)}`;
    const criar = await c.adminA.client.rpc("equipe_criar_departamento", { p_nome: nome, p_descricao: "desc" });
    expect(criar.error).toBeNull();
    const depId = criar.data as string;
    departamentosCriados.push(depId);

    const repetido = await c.adminA.client.rpc("equipe_criar_departamento", { p_nome: nome.toUpperCase() });
    expect(repetido.error?.code).toBe("EQ409");

    const renomear = await c.adminA.client.rpc("equipe_atualizar_departamento", { p_id: depId, p_nome: `${nome} 2`, p_descricao: null });
    expect(renomear.error).toBeNull();

    const { data: modulos } = await admin.from("modulos").select("id, slug");
    const [m1, m2] = modulos!;
    const salvar = await c.adminA.client.rpc("equipe_salvar_matriz_do_departamento", {
      p_departamento_id: depId,
      p_permissoes: [
        { moduloId: m1!.id, nivel: "total" },
        { moduloId: m2!.id, nivel: "leitura" },
      ],
    });
    expect(salvar.error).toBeNull();

    // matriz inválida (2º item com nível desconhecido): nada muda, inclusive o 1º item
    const invalida = await c.adminA.client.rpc("equipe_salvar_matriz_do_departamento", {
      p_departamento_id: depId,
      p_permissoes: [
        { moduloId: m1!.id, nivel: null },
        { moduloId: m2!.id, nivel: "superadmin" },
      ],
    });
    expect(invalida.error?.code).toBe("EQ400");
    const { data: linhas } = await admin.from("departamento_modulos").select("modulo_id, nivel_acesso").eq("departamento_id", depId);
    expect(linhas).toHaveLength(2);

    const repetidoNaMatriz = await c.adminA.client.rpc("equipe_salvar_matriz_do_departamento", {
      p_departamento_id: depId,
      p_permissoes: [
        { moduloId: m1!.id, nivel: "total" },
        { moduloId: m1!.id, nivel: "leitura" },
      ],
    });
    expect(repetidoNaMatriz.error?.code).toBe("EQ400");

    const remover = await c.adminA.client.rpc("equipe_remover_departamento", { p_id: depId });
    expect(remover.error).toBeNull();
    const { data: sobrou } = await admin.from("departamentos").select("id").eq("id", depId);
    expect(sobrou).toHaveLength(0);
  });

  it("departamento com membros não é apagado (409) e 'Voluntariado' é protegido", async () => {
    const depId = await departamentoDoTeste(c.semAdmin.id);
    const comMembros = await c.adminA.client.rpc("equipe_remover_departamento", { p_id: depId });
    expect(comMembros.error?.code).toBe("EQ409");

    const { data: vol } = await admin.from("departamentos").select("id").eq("nome", "Voluntariado").single();
    const apagar = await c.adminA.client.rpc("equipe_remover_departamento", { p_id: vol!.id });
    expect(apagar.error?.code).toBe("EQ409");
    const renomear = await c.adminA.client.rpc("equipe_atualizar_departamento", { p_id: vol!.id, p_nome: "Outro nome" });
    expect(renomear.error?.code).toBe("EQ409");
  });

  it("Auth: conta nova nasce com trocar_senha, entra em Voluntariado, e a troca da senha limpa a flag sem perder o resto", async () => {
    const email = `integracao-${randomUUID().slice(0, 8)}@teste.local`;
    const provisoria = `Prov-${randomUUID()}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: provisoria,
      email_confirm: true,
      user_metadata: { nome: "Pessoa Nova" },
      app_metadata: { trocar_senha: true },
    });
    expect(error).toBeNull();
    const id = data.user!.id;
    try {
      expect(data.user!.app_metadata.trocar_senha).toBe(true);
      const { data: linha } = await admin.from("usuarios").select("nome").eq("id", id).single();
      expect(linha?.nome).toBe("Pessoa Nova");
      expect(await departamentoDe(id)).toHaveLength(1);

      const nova = `Nova-${randomUUID()}`;
      const { data: trocado } = await admin.auth.admin.updateUserById(id, { password: nova, app_metadata: { trocar_senha: false } });
      expect(trocado.user!.app_metadata.trocar_senha).toBe(false);
      expect(trocado.user!.app_metadata.provider).toBe("email");

      // desativado não consegue entrar; reativado volta
      await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
      const { error: bloqueado } = await clienteAnon().auth.signInWithPassword({ email, password: nova });
      expect(bloqueado).not.toBeNull();
      await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
      const { error: liberado } = await clienteAnon().auth.signInWithPassword({ email, password: nova });
      expect(liberado).toBeNull();
    } finally {
      await admin.auth.admin.deleteUser(id);
      await admin.from("usuarios").delete().eq("id", id);
    }
  });

  it("ids inexistentes: membro 404 (P0002) e departamento no vínculo 400 (EQ400)", async () => {
    const membro = await c.adminA.client.rpc("equipe_definir_departamentos_do_membro", {
      p_usuario_id: randomUUID(),
      p_departamento_ids: [],
    });
    expect(membro.error?.code).toBe("P0002");

    const dep = await c.adminA.client.rpc("equipe_definir_departamentos_do_membro", {
      p_usuario_id: c.adminB.id,
      p_departamento_ids: [randomUUID()],
    });
    expect(dep.error?.code).toBe("EQ400");
  });
});
