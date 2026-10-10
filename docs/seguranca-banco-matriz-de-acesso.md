# Matriz de acesso do banco (Supabase)

Quem pode fazer o quê em cada tabela do schema `public`. Resultado da auditoria do KAN-101, conferida no banco real em 05/10/2026 e consolidada nas migrations `20261005160000` a `20261005160500`.

## Como o acesso funciona

Três papéis chegam ao banco:

- **`anon`**: visitante sem login (o site público e as rotas `/api/public/*` da API). Só lê o que o produto manda mostrar.
- **`authenticated`**: usuário logado no painel. A API fala com o banco como esse usuário (`createSupabaseForUser`), então o que ele pode é decidido pelo RLS com `check_user_access(módulo, nível)`. Ler pede qualquer nível no módulo; criar, editar e apagar pedem nível `total`.
- **`service_role`**: só o backend, com a chave secreta. Ignora o RLS.

Duas camadas protegem o `anon`: o **GRANT** (quais colunas e tabelas ele pode tocar) e o **RLS** (quais linhas). Todas as tabelas têm RLS ligado.

## Matriz

Legenda: **—** nenhum acesso · **ler** SELECT · **escrever** INSERT/UPDATE/DELETE.

| Tabela | `anon` | `authenticated` | Observação |
|---|---|---|---|
| `animais` | ler, só linhas `status_adocao = 'disponivel'` e só estas colunas: `id`, `nome`, `especie`, `raca`, `status_adocao`, `url_foto`, `created_at` (+ `porte`, `faixa_etaria`, `idade_texto`, `descricao` depois do KAN-107) | módulo `operacional`: ler (qualquer nível), escrever (`total`) | `anon` **não** lê `adotante_*`, `adotante_id`, `lar_temporario_id` nem `data_adocao` |
| `events` | ler, só `is_active = true` | módulo `campanhas`: ler / escrever (`total`) | |
| `urgency_items` | ler, só `is_active = true` | módulo `urgencias`: ler / escrever (`total`) | |
| `pontos_coleta` | ler, só `ativo = true` e colunas `id`, `nome`, `endereco`, `horario`, `ativo` (**depois do KAN-108**; hoje —) | módulo `campanhas`: ler / escrever (`total`) (**depois do KAN-108**; hoje —) | decisão a confirmar: módulo `campanhas` |
| `lares_temporarios` | — | módulo `lares`: ler / escrever (`total`) (policies por operação na `20261005160300`) | dados pessoais (LGPD) |
| `medical_records` | — | módulo `operacional`: ler / escrever (`total`) | |
| `departamentos` | — | ler tudo | antes era legível pelo `anon` |
| `usuarios` | — | ler só o próprio registro | |
| `usuario_departamentos` | — | ler só os próprios vínculos | |
| `adotantes`, `agradecimentos`, `doacoes`, `documentos_admin`, `reservas_hotel` | — | — (sem policy) | só o backend com `service_role` |
| `voluntarios` | — | — (sem policy; KAN-75) | dados pessoais (LGPD) |
| `cargos`, `modulos`, `cargo_modulos`, `departamento_modulos`, `usuario_cargos` | — | — (sem policy) | lidos por `check_user_access`, que é `SECURITY DEFINER` e ignora o RLS |

**Storage:** o bucket `animal-photos` é público para leitura; só quem tem `operacional` com nível `total` envia fotos.

## Privilégios (GRANT)

- `anon`: só `SELECT` e só em `events`, `urgency_items`, `animais` (por coluna) e, depois do KAN-108, `pontos_coleta` (por coluna). Nada de `INSERT`, `UPDATE`, `DELETE` nem `TRUNCATE`.
- `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`. Sem `TRUNCATE`, `TRIGGER` nem `REFERENCES`.
- Tabelas criadas daqui para frente **não** nascem com acesso do `anon` (`ALTER DEFAULT PRIVILEGES`).

## Regras para mudar isto

1. **Tabela nova**: ligar o RLS, criar as policies por operação e dar `GRANT` explícito ao que o `anon` precisa. Nunca `FOR ALL`: ele deixa qualquer nível de acesso escrever.
2. **Coluna nova que o site público deve mostrar**: acrescentar à lista do `GRANT SELECT (...)` do `anon` em uma migration. Sem isso o `anon` não a enxerga, de propósito.
3. **Dados de pessoas** (adotantes, voluntários, responsáveis de lares, doadores) nunca têm leitura pública.
4. **Rotas `/api/public/*`** usam o client anônimo (`createSupabaseAnon`), nunca `supabaseAdmin`, e devolvem uma lista fixa de campos.

## Como conferir

- `supabase/audit/01_inspecionar_rls.sql`: RLS, grants e policies reais (somente leitura).
- `supabase/audit/02_testar_anon.mjs`: o que um visitante anônimo consegue ler, tabela por tabela.
- `supabase/audit/04_conferir_drift.sql`: se o banco real tem o que as migrations dizem criar.

Rode os três depois de qualquer migration que mexa em permissões. Em 05/10/2026 foi descoberto que migrations constavam como aplicadas no histórico do Supabase sem terem surtido efeito, então **o histórico não prova o estado do banco**: o `04` prova.
