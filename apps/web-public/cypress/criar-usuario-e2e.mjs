// Cria (ou recria) o usuário do teste e2e no Supabase LOCAL, com acesso total a
// animais (módulo `operacional`). Rodar depois do `supabase start`/`db reset`:
//   node apps/web-public/cypress/criar-usuario-e2e.mjs
// Ver docs/testes-integracao-e2e.md.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
// Chave de demonstração do Supabase local (pública, não é segredo).
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const email = process.env.E2E_EMAIL ?? "e2e@amemais.local";
const password = process.env.E2E_PASSWORD ?? "e2e-senha-local";
const DEPARTAMENTO = "E2E";

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
  throw new Error(`Este script só roda no Supabase local, não em ${url}`);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

function ok({ data, error }) {
  if (error) throw error;
  return data;
}

const { users } = ok(await admin.auth.admin.listUsers());
const antigo = users.find((u) => u.email === email);
if (antigo) ok(await admin.auth.admin.deleteUser(antigo.id));

const { user } = ok(
  await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nome: "Teste E2E" } }),
);
ok(await admin.from("usuarios").upsert({ id: user.id, nome: "Teste E2E", email }, { onConflict: "id" }));

let departamento = ok(await admin.from("departamentos").select("id").eq("nome", DEPARTAMENTO).maybeSingle());
if (!departamento) departamento = ok(await admin.from("departamentos").insert({ nome: DEPARTAMENTO }).select("id").single());

const modulo = ok(await admin.from("modulos").select("id").eq("slug", "operacional").single());
ok(
  await admin
    .from("departamento_modulos")
    .upsert({ departamento_id: departamento.id, modulo_id: modulo.id, nivel_acesso: "total" }),
);
ok(await admin.from("usuario_departamentos").insert({ usuario_id: user.id, departamento_id: departamento.id }));

console.log(`Usuário e2e pronto: ${email}`);
