# 0008 — Migrar auth/admin para `apps/web-admin` e renomear `apps/web` → `apps/web-example`

## Contexto

A ADR [0007](./0007-separacao-frontend-publico-admin.md) criou `apps/web-public` e `apps/web-admin`, mas deixou `apps/web` intocado porque ele ainda tinha código real: integração com Supabase Auth (`src/features/auth/`), rota `/login` e `/admin` protegida por `AdminGuard`. Isso deixava três apps de frontend, com o de nome mais genérico (`apps/web`) sendo o único com autenticação de verdade — confuso pra quem chegasse no projeto agora.

## Decisão

- **Migrado** para `apps/web-admin` (é lá que login/admin fazem sentido): `src/features/auth/` inteiro, `app/login/`, `app/admin/`. As peças de infra mínimas que tanto o auth quanto a feature de exemplo usam (`src/lib/supabase.ts`, `src/lib/axios.ts`, `src/lib/cn.ts`, `src/lib/query-provider.tsx`, `src/components/ui/button.tsx`) foram **duplicadas** (não movidas) para `apps/web-admin` — cada app do monorepo já é independente por design (ADR [0001](./0001-separacao-web-api.md)), então cada um mantém sua própria cópia dessas peças mínimas em vez de criar uma dependência cruzada entre `apps/web-example` e `apps/web-admin`.
- `apps/web` foi **renomeado para `apps/web-example`** (pacote `@amemais/web-example`, mesma porta `3000`). O que sobrou nele é só a feature de demonstração (`_example-demo`, rota `/example-demo`) — material de estudo de como um frontend Next.js consome o `apps/api` (`route → controller → service → repository`), não um dos sites reais do produto.

## Alternativas consideradas

- **Apagar `apps/web` inteiro em vez de virar exemplo**: descartada — a integração de auth já estava pronta e testada (Épico 0), e o fluxo completo (login → sessão → guard de rota → chamada autenticada à API) é justamente o material mais útil pra um dev júnior estudar antes de implementar a primeira feature real em `apps/web-admin`.
- **Compartilhar as peças de infra duplicadas via um pacote `packages/web-shared`**: mais DRY, mas prematuro — só 5 arquivos pequenos duplicados entre 2 apps (com um terceiro, `apps/web-public`, que ainda nem os usa) não paga o custo de criar e versionar mais um pacote agora. Revisitar se a duplicação crescer.

## Trade-offs

- **A favor**: `apps/web-admin` fica com autenticação completa e funcional desde já; `apps/web-example` deixa de ser ambíguo (nome não sugere mais que é "o frontend" real); qualquer dev novo sabe, só pelo nome da pasta, que não deve construir feature de produto ali.
- **Contra (custo aceito)**: duplicação pontual de 5 arquivos pequenos de infra entre `apps/web-admin` e `apps/web-example` até existir necessidade real de um pacote compartilhado.

## Motivo principal

Terminar a transição iniciada na ADR 0007: eliminar a ambiguidade de ter um app chamado só "web" com código de produto real, migrando esse código pro app onde ele realmente pertence e deixando claro, pelo nome da pasta, o que é exemplo e o que é site real.
