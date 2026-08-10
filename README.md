# AmeMais

Monorepo do projeto de extensão universitária **AmeMais**, em parceria com a ONG AmeMais (Teófilo Otoni - MG).

## Sobre o projeto

O site atual da ONG ([amemais.ueniweb.com](https://amemais.ueniweb.com/)) é engessado, tem formulários confusos e não informa pontos de coleta, forma de entrega de animais resgatados nem o histórico de ações — isso gera desconfiança e prejudica doações e resgates.

Este projeto substitui esse site por uma plataforma dividida em duas frentes:

- **Portal Público**: home moderna, mural de animais disponíveis para adoção (com filtros) e central de ajuda (PIX, QR Code, lista de urgências da semana).
- **Painel Administrativo**: controle de animais (ficha médica, status, fotos), rede de lares temporários e gestão de eventos (feirinhas, bazares) — restrito a colaboradores e administradores via RBAC/RLS.

## Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, shadcn/ui, GSAP, TanStack Query, Axios
- **Backend**: Next.js (App Router, Route Handlers), Zod, Supabase Auth
- **Banco de dados**: Supabase (Postgres + Storage), com RLS
- **Gerenciador de pacotes**: Yarn (workspaces)
- **Orquestração do monorepo**: Turborepo
- **Hospedagem**: Vercel (um projeto para `apps/web`, outro para `apps/api`)

## Estrutura

```
apps/
  web/      # frontend (Next.js)
  api/      # backend (Next.js, só API — sem UI)
packages/
  shared-types/       # tipos/DTOs compartilhados entre web e api
  eslint-config/       # config de lint compartilhada
  typescript-config/   # config de TS compartilhada
docs/
  decisions/  # registro das decisões de arquitetura (ADRs)
supabase/
  migrations/ # schema do banco, versionado
```

`apps/web` e `apps/api` são dois apps Next.js separados. Detalhes das decisões de arquitetura em [`docs/`](./docs/README.md).

## Como contribuir (fluxo de branches e PR)

A `main` é protegida — ninguém dá `push` ou merge direto nela, só o tech lead. Toda mudança precisa ir por uma branch própria e um Pull Request revisado antes de entrar.

📄 Passo a passo completo, explicado para quem nunca fez isso: [`docs/github-workflow.md`](./docs/github-workflow.md).

## Como configurar o ambiente local

### 1. Pré-requisitos (uma vez por máquina)

- **Node.js** na versão do [`.nvmrc`](./.nvmrc) — baixe em https://nodejs.org (LTS). Checar: `node -v`.
- **Yarn**: rode `corepack enable`. Checar: `yarn -v`.
- **VS Code** (recomendado) com a extensão "ESLint".

### 2. Clonar e instalar dependências

```bash
git clone <url-do-repositorio>
cd AmeMais
yarn install
```

Isso instala as dependências de `apps/web`, `apps/api` e `packages/*` de uma vez (não precisa repetir em cada pasta).

### 3. Variáveis de ambiente

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.local.example apps/api/.env.local
```

Preencha os dois `.env.local` com as chaves do Supabase (peça ao tech lead). Sem isso o `apps/api` sobe, mas as chamadas ao Supabase falham.

### 4. Rodar em desenvolvimento

```bash
yarn dev
```

Sobe os dois apps ao mesmo tempo (via Turborepo):

- Frontend: http://localhost:3000
- Backend: http://localhost:3001 (teste em http://localhost:3001/api/health)

`Ctrl+C` para parar.

### 5. Outros comandos úteis

```bash
yarn build        # build de produção
yarn lint         # checa lint
yarn type-check   # checa tipos
```

Rode `yarn lint` e `yarn type-check` antes de abrir um Pull Request.

### 6. Banco de dados (migrations do Supabase)

O schema do banco fica versionado em `supabase/migrations/`. Pré-requisito: [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) instalado (`npm install -g supabase`) e logado (`supabase login`).

```bash
supabase link --project-ref <ref-do-projeto>   # uma vez por pessoa
supabase db push                                # aplica migrations pendentes
```

Para criar uma migration nova:

```bash
supabase migration new nome_da_migration
# edite o .sql gerado em supabase/migrations/
supabase db push
```

Nunca edite uma migration já aplicada/commitada — crie uma nova para corrigir algo.

### 7. VS Code: TypeScript do projeto

Se o editor mostrar erros que o build não mostra (ex.: erro de JSX em `.tsx`), o `.vscode/settings.json` já resolve isso. Ao abrir o projeto:

1. Abra um arquivo `.ts`/`.tsx`.
2. Se aparecer aviso sobre versão do TypeScript do workspace, clique em **"Allow"**.
3. Se persistir: `Ctrl+Shift+P` → `TypeScript: Restart TS Server`.

### Problemas comuns

- **Porta já em uso**: feche o terminal anterior ou mate o processo usando a porta 3000/3001.
- **Erro de Supabase/env**: confira se preencheu o `.env.local` (passo 3).
- **Mudança em `packages/shared-types` não refletiu**: reinicie o `yarn dev`.

## Licença

Este projeto foi feito para uso da **ONG AmeMais**, sem fins lucrativos. O código **não pode ser vendido nem usado comercialmente** — pode ser usado, estudado e modificado livremente para fins não comerciais. Detalhes em [`LICENSE.md`](./LICENSE.md).
