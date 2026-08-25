# 0007 — Separar o frontend em `apps/web-public` e `apps/web-admin`

## Contexto

A ADR [0001](./0001-separacao-web-api.md) separou `apps/web` (frontend) de `apps/api` (backend) por fronteira física de pastas, pensando num time júnior. Só que "o frontend" na prática são dois produtos com público, times e ciclo de deploy diferentes:

- **Site público** — vitrine institucional da ONG (adoção, doações, conteúdo aberto).
- **Painel admin** — área logada de gestão interna (uso restrito a voluntários/staff autenticado).

Até aqui os dois viviam misturados dentro de um único app (`apps/web`, com rotas `/`, `/login`, `/admin`), o que reproduz dentro do frontend o mesmo problema que a ADR 0001 já tinha resolvido entre front e back: nada impede um dev de acoplar por engano código público com código autenticado, ou de vazar algo do painel admin pro bundle público.

## Decisão

O frontend passa a ter dois apps Next.js independentes, seguindo o mesmo padrão de configuração de `apps/web` (App Router, TypeScript, Tailwind v4):

- `apps/web-public` — site público, sem autenticação.
- `apps/web-admin` — painel administrativo, atrás de login.

Cada um com seu próprio `package.json`, porta de dev (`3002` e `3003`, para não colidir com `apps/web` em `3000` e `apps/api` em `3001`), deploy e ciclo de vida — comunicando-se com `apps/api` via HTTP, do mesmo jeito que `apps/web` já fazia.

A organização interna de cada um segue a ADR [0003](./0003-frontend-feature-based.md) (feature-based): `src/features/<feature>/{components,hooks,services}` e `src/components/ui/` para o que é genérico de verdade.

`apps/web` (o app original, que na época desta decisão ainda tinha o código real de login/admin/auth) seguiu existindo por uma tarefa até a migração desse código para `apps/web-admin` — ver ADR [0008](./0008-apps-web-vira-web-example.md).

## Alternativas consideradas

- **Manter um único `apps/web` com convenção de pastas** (ex.: `app/(public)/` e `app/(admin)/` via route groups do Next.js): mais simples de configurar, um só `package.json`/deploy. Foi descartada pelo mesmo motivo da ADR 0001 — depende de disciplina do time em não vazar código entre as duas áreas, em vez de uma fronteira física que torna o erro mais difícil de acontecer sem querer.

## Trade-offs

- **A favor da separação**: fronteira física de pastas entre público e admin, cada um com seu próprio bundle (nada do painel admin vaza pro cliente público por engano), e possibilidade de deploys/times independentes conforme o projeto cresce.
- **Contra a separação (custos aceitos)**: mais um projeto na Vercel, mais um `package.json`/config para manter em sincronia (mesmo trade-off já aceito na ADR 0001), e eventual duplicação de código realmente compartilhado entre os dois (ex.: cliente Supabase, componentes de UI genéricos) até existir um pacote compartilhado dedicado, se necessário.

## Motivo principal

Mesmo raciocínio da ADR 0001, aplicado agora dentro do frontend: trocar uma convenção de código (que depende de disciplina) por uma fronteira física de pastas/apps (auto-explicativa e mais difícil de violar sem querer) entre o site público e o painel administrativo.
