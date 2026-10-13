import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Helpers dos testes de integração: rodam contra o Supabase LOCAL (`supabase start`),
 * nunca contra o banco do projeto. As chaves padrão são as chaves de demonstração
 * que todo Supabase local usa (públicas, não são segredo). No CI elas vêm do
 * `supabase status -o env`.
 */
export const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
export const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
export const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(SUPABASE_URL)) {
  throw new Error(`Testes de integração só rodam no Supabase local, não em ${SUPABASE_URL}`);
}

const SEM_SESSAO = { auth: { persistSession: false, autoRefreshToken: false } };

/** Client sem RLS (service role): só para preparar e limpar os dados do teste. */
export const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, SEM_SESSAO);

/** Client do visitante do site (role `anon`). */
export function clienteAnon(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, SEM_SESSAO);
}

export type NivelAcesso = "leitura" | "total";

export interface UsuarioDeTeste {
  id: string;
  client: SupabaseClient;
}

/**
 * Prepara um cenário isolado: um departamento só do teste, com `nivel` no módulo
 * `modulo`, e um usuário logado nele. Sem `nivel`, o usuário não tem acesso a nada.
 * Devolve uma função que apaga tudo no fim.
 */
export async function criarUsuario(modulo: string, nivel?: NivelAcesso): Promise<UsuarioDeTeste & { limpar: () => Promise<void> }> {
  const sufixo = randomUUID().slice(0, 8);
  const email = `integracao-${sufixo}@teste.local`;
  const senha = `senha-${randomUUID()}`;

  const { data: criado, error: erroUsuario } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: `Integração ${sufixo}` },
  });
  if (erroUsuario) throw erroUsuario;
  const id = criado.user.id;

  // O trigger on_auth_user_created cria a linha em `usuarios`; o upsert cobre o caso de ele não existir.
  await falhaSeErro(admin.from("usuarios").upsert({ id, nome: `Integração ${sufixo}`, email }, { onConflict: "id" }));

  let departamentoId: string | null = null;
  if (nivel) {
    const { data: departamento } = await falhaSeErro(
      admin.from("departamentos").insert({ nome: `Integração ${sufixo}` }).select("id").single(),
    );
    departamentoId = (departamento as { id: string }).id;
    const { data: mod } = await falhaSeErro(admin.from("modulos").select("id").eq("slug", modulo).single());
    await falhaSeErro(
      admin.from("departamento_modulos").insert({
        departamento_id: departamentoId,
        modulo_id: (mod as { id: string }).id,
        nivel_acesso: nivel,
      }),
    );
    await falhaSeErro(admin.from("usuario_departamentos").insert({ usuario_id: id, departamento_id: departamentoId }));
  }

  const client = createClient(SUPABASE_URL, ANON_KEY, SEM_SESSAO);
  const { error: erroLogin } = await client.auth.signInWithPassword({ email, password: senha });
  if (erroLogin) throw erroLogin;

  return {
    id,
    client,
    limpar: async () => {
      if (departamentoId) await admin.from("departamentos").delete().eq("id", departamentoId);
      await admin.auth.admin.deleteUser(id);
      await admin.from("usuarios").delete().eq("id", id);
    },
  };
}

async function falhaSeErro<T extends { error: unknown }>(consulta: PromiseLike<T>): Promise<T> {
  const resultado = await consulta;
  if (resultado.error) throw resultado.error;
  return resultado;
}
