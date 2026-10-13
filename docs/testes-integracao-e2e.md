# Testes de integração e e2e

Os testes de unidade (`yarn test`) usam repository falso: são rápidos, mas não pegam uma regra de RLS errada nem um fluxo quebrado entre o painel e o site. Para isso existem duas camadas a mais, que rodam contra um **Supabase local** (nunca contra o banco do projeto):

| Camada | Onde | O que cobre |
| --- | --- | --- |
| Integração | `apps/api/tests-integration/` (Vitest) | RLS de verdade no Postgres: anon, usuário sem permissão, com `leitura` e com `total` em `lares_temporarios` e `voluntarios`; o que o anon vê de `animais` |
| E2E | `apps/web-public/cypress/e2e/` (Cypress) | Login no admin → cadastrar animal com foto → ele aparecer em `/adote` com a foto carregada |

No CI rodam no job **`testes-integracao-e2e`**, separado do `pipeline-de-validacao`: os dois correm em paralelo e o pipeline rápido não espera os testes lentos.

## Pré-requisitos

- Docker rodando (Docker Desktop no Windows/Mac).
- Supabase CLI (`npx supabase` serve).

## Rodar os testes de integração

```bash
# na raiz do repo
npx supabase start          # sobe o banco local com as migrations e o seed
npx supabase db reset       # (opcional) volta ao estado limpo

yarn workspace @amemais/api test:integration
```

As chaves do Supabase local são fixas e públicas, então não precisa configurar nada. Os helpers recusam rodar se `SUPABASE_URL` apontar para algo que não seja `127.0.0.1`/`localhost`.

Cada teste cria os próprios usuários e departamentos e apaga tudo no fim.

## Rodar o e2e

O e2e precisa das 3 apps no ar apontando para o Supabase local. **Atenção:** os `.env.local` de cada app costumam apontar para o banco do projeto; as variáveis abaixo têm prioridade sobre eles, então defina **todas**.

```bash
# chaves: `npx supabase status -o env` (ANON_KEY, SERVICE_ROLE_KEY, JWT_SECRET)
export SUPABASE_URL=http://127.0.0.1:54321
export SUPABASE_ANON_KEY=<ANON_KEY>
export SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
export SUPABASE_JWT_SECRET=<JWT_SECRET>
export NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
export NEXT_PUBLIC_API_URL=http://localhost:3001 API_URL=http://localhost:3001
export NEXT_PUBLIC_SITE_URL=http://localhost:3002
export ALLOWED_ORIGINS=http://localhost:3002,http://localhost:3003
export WEB_PUBLIC_URL=http://localhost:3002 REVALIDATE_SECRET=qualquer-coisa-local

# build + start de cada app (em terminais separados ou em background)
yarn workspace @amemais/api build        && yarn workspace @amemais/api start
yarn workspace @amemais/web-admin build  && yarn workspace @amemais/web-admin start
yarn workspace @amemais/web-public build && yarn workspace @amemais/web-public start

# usuário do teste (e2e@amemais.local, acesso total a animais)
node apps/web-public/cypress/criar-usuario-e2e.mjs

yarn workspace @amemais/web-public cypress run    # ou cypress:open para ver no navegador
```

Use `build` + `start`, não `dev`: o cache do site (ISR) só funciona como em produção no modo `start`.

## Quando um teste falha

- **Integração:** a mensagem diz qual usuário conseguiu (ou não) fazer o quê. Normalmente é uma policy que mudou numa migration. Rode `npx supabase db reset` e o teste de novo antes de investigar.
- **E2E no CI:** o job anexa os logs das apps e os screenshots do Cypress no artefato `e2e-falha` (aba *Summary* da execução).

## Escrevendo testes novos

- Integração: use `criarUsuario(modulo, nivel)` de `tests-integration/helpers.ts`, que cria um usuário isolado e devolve um client já logado. Crie os dados com o client `admin` (service role) e apague no `afterAll`.
- E2E: cada `it` deve visitar uma origem só (admin **ou** site). Ao trocar de origem o Cypress recarrega a spec, então valores gerados num teste passam para o outro por arquivo (veja `admin-para-site.cy.ts`).
