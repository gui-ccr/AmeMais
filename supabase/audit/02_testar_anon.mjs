// ==============================================================================
// KAN-101 — Auditoria de segurança: testa o que o papel ANON consegue fazer.
//
// Uso (na raiz do repositório, Node 22):
//
//   node --env-file=apps/web-admin/.env.local supabase/audit/02_testar_anon.mjs
//
// Por padrão é SOMENTE LEITURA: só conta quantas linhas o anon consegue ver em
// cada tabela (não imprime nenhum dado).
//
// Teste de escrita (opcional) — SÓ em projeto de TESTE, nunca em produção:
//
//   node --env-file=apps/web-admin/.env.local supabase/audit/02_testar_anon.mjs --probar-insert
//
// O teste de INSERT manda um objeto vazio. Se o RLS bloquear, volta 42501.
// Se o RLS deixar passar, normalmente falha numa constraint (ex.: NOT NULL) e
// nada é gravado. MAS uma tabela cujas colunas todas têm default pode ACEITAR a
// linha vazia — por isso a flag exige confirmação e não vem ligada.
//
// UPDATE e DELETE não são testados aqui: com RLS, o Postgres filtra as linhas
// em silêncio e o resultado "0 linhas" é igual com ou sem permissão. Para essas
// operações use o bloco C (pg_policies) de 01_inspecionar_rls.sql.
// ==============================================================================
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Use: node --env-file=apps/web-admin/.env.local supabase/audit/02_testar_anon.mjs",
  );
  process.exit(1);
}

const probarInsert = process.argv.includes("--probar-insert");

// Tabelas do schema public criadas pelas migrations. Se criar tabela nova,
// acrescente aqui.
const TABELAS = [
  "adotantes",
  "agradecimentos",
  "animais",
  "cargo_modulos",
  "cargos",
  "departamento_modulos",
  "departamentos",
  "doacoes",
  "documentos_admin",
  "events",
  "examples",
  "lares_temporarios",
  "medical_records",
  "modulos",
  "pontos_coleta",
  "profiles",
  "reservas_hotel",
  "urgency_items",
  "usuario_cargos",
  "usuario_departamentos",
  "usuarios",
  "voluntarios",
];

// Tabelas que o PRD (seção 6) diz que o público PODE ler. Qualquer outra que o
// anon consiga ler é um achado.
const PUBLICAS_POR_DESIGN = new Set(["animais", "events", "urgency_items", "pontos_coleta"]);

// Cliente SEM sessão: é exatamente o que um visitante anônimo tem.
const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function confirmar() {
  const host = new URL(url).host;
  console.log(`\nVocê pediu o teste de INSERT contra: ${host}`);
  console.log("Isso pode gravar uma linha vazia em tabelas sem NOT NULL.");
  console.log('Digite o host acima para confirmar que é um projeto de TESTE:');
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const resposta = (await rl.question("> ")).trim();
  rl.close();
  return resposta === host;
}

function classificarLeitura(error, count) {
  if (error) {
    // 42501 = permission denied; PGRST301/401 = sem acesso; 42P01 = tabela não existe
    if (error.code === "42P01" || error.code === "PGRST205") return { status: "NAO_EXISTE", detalhe: error.message };
    return { status: "BLOQUEADO", detalhe: `${error.code ?? ""} ${error.message}`.trim() };
  }
  if (count > 0) return { status: "LE_DADOS", detalhe: `${count} linha(s) visível(is)` };
  return { status: "LE_VAZIO", detalhe: "sem erro, 0 linhas (RLS filtrando ou tabela vazia)" };
}

function classificarInsert(error) {
  if (!error) return { status: "INSERIU", detalhe: "ATENÇÃO: uma linha foi gravada, apague-a" };
  // 42501 = RLS/permissão negou antes de qualquer outra checagem
  if (error.code === "42501") return { status: "BLOQUEADO", detalhe: error.message };
  // Qualquer outro erro (NOT NULL, FK, check) significa que o RLS DEIXOU PASSAR
  return { status: "RLS_PERMITIU", detalhe: `${error.code ?? ""} ${error.message}`.trim() };
}

if (probarInsert && !(await confirmar())) {
  console.error("Host não confere. Teste de INSERT cancelado, nada foi enviado.");
  process.exit(1);
}

const resultados = [];

for (const tabela of TABELAS) {
  const { error, count } = await supabase
    .from(tabela)
    .select("*", { count: "exact", head: true });
  const leitura = classificarLeitura(error, count ?? 0);

  let escrita = { status: "NAO_TESTADO", detalhe: "" };
  if (probarInsert && leitura.status !== "NAO_EXISTE") {
    const { error: insertError } = await supabase.from(tabela).insert({});
    escrita = classificarInsert(insertError);
  }

  const achado =
    ((leitura.status === "LE_DADOS" || leitura.status === "LE_VAZIO") && !PUBLICAS_POR_DESIGN.has(tabela)) ||
    escrita.status === "INSERIU" ||
    escrita.status === "RLS_PERMITIU";

  resultados.push({ tabela, leitura: leitura.status, escrita: escrita.status, achado, leituraDetalhe: leitura.detalhe, escritaDetalhe: escrita.detalhe });
}

console.log(`\nProjeto: ${new URL(url).host}   |   INSERT testado: ${probarInsert ? "sim" : "não"}\n`);
console.table(
  resultados.map(({ tabela, leitura, escrita, achado }) => ({
    tabela,
    "anon lê?": leitura,
    "anon insere?": escrita,
    "ACHADO?": achado ? "SIM" : "",
  })),
);

const achados = resultados.filter((r) => r.achado);
console.log(`\n${achados.length} tabela(s) com possível achado:`);
for (const r of achados) {
  console.log(`- ${r.tabela}: leitura=${r.leitura} (${r.leituraDetalhe})${r.escrita !== "NAO_TESTADO" ? `; insert=${r.escrita} (${r.escritaDetalhe})` : ""}`);
}
console.log(
  "\nLE_VAZIO não prova que está protegido: a tabela pode estar vazia. Compare com o bloco A/D de 01_inspecionar_rls.sql.",
);
