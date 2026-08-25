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
- **Hospedagem**: Vercel (um projeto por app)

## Estrutura

```
apps/
  web-public/   # Portal Público (Next.js)
  web-admin/    # Painel Administrativo (Next.js)
  api/          # backend (Next.js, só API — sem UI)
  web-example/  # app de exemplo/estudo, não é um dos sites reais (ver apps/web-example/README.md)
packages/
  shared-types/       # tipos/DTOs compartilhados entre os apps
  eslint-config/       # config de lint compartilhada
  typescript-config/   # config de TS compartilhada
docs/
  decisions/  # registro das decisões de arquitetura (ADRs)
supabase/
  migrations/ # schema do banco, versionado
```

`apps/web-public`, `apps/web-admin`, `apps/web-example` e `apps/api` são quatro apps Next.js separados (ver ADR [0007](./docs/decisions/0007-separacao-frontend-publico-admin.md) sobre a divisão do frontend).

## Documentação

| Documento | Sobre |
| --- | --- |
| [`docs/pre-requisitos.md`](./docs/pre-requisitos.md) | **Antes de começar**: o que instalar no computador (Git, Node, Yarn, Supabase CLI) e como |
| [`docs/prd.md`](./docs/prd.md) | PRD do produto: problema, personas, escopo do MVP e critérios de aceite |
| [`docs/arquitetura-e-roadmap.md`](./docs/arquitetura-e-roadmap.md) | Arquitetura alvo, lacunas técnicas e roteiro de tarefas |
| [`docs/README.md`](./docs/README.md) | Índice das decisões de arquitetura (ADRs) — o *porquê* de cada escolha técnica |
| [`docs/decisions/0001-separacao-web-api.md`](./docs/decisions/0001-separacao-web-api.md) | Por que `apps/web` e `apps/api` são separados |
| [`docs/decisions/0002-arquitetura-backend-layered-feature-based.md`](./docs/decisions/0002-arquitetura-backend-layered-feature-based.md) | Arquitetura do backend |
| [`docs/decisions/0003-frontend-feature-based.md`](./docs/decisions/0003-frontend-feature-based.md) | Organização do frontend |
| [`docs/decisions/0004-turborepo-yarn-workspaces.md`](./docs/decisions/0004-turborepo-yarn-workspaces.md) | Turborepo + Yarn workspaces |
| [`docs/decisions/0005-stack-principal.md`](./docs/decisions/0005-stack-principal.md) | Stack principal do projeto |
| [`docs/decisions/0006-storage-fotos-animais.md`](./docs/decisions/0006-storage-fotos-animais.md) | Supabase Storage para fotos de animais |
| [`docs/decisions/0007-separacao-frontend-publico-admin.md`](./docs/decisions/0007-separacao-frontend-publico-admin.md) | Separar o frontend em `apps/web-public` e `apps/web-admin` |
| [`docs/github-workflow.md`](./docs/github-workflow.md) | **Como contribuir**: passo a passo de branch, commit e Pull Request |
| [`LICENSE.md`](./LICENSE.md) | Licença do projeto (uso não comercial) |

## Como contribuir (fluxo de branches e PR)

A `main` é protegida — ninguém dá `push` ou merge direto nela, só o tech lead. Toda mudança precisa ir por uma branch própria e um Pull Request revisado antes de entrar.

📄 Passo a passo completo, explicado para quem nunca fez isso: [`docs/github-workflow.md`](./docs/github-workflow.md).

## Como configurar o ambiente local

Passo a passo completo, do zero até o projeto rodando no navegador.

### 1. Pré-requisitos (uma vez por máquina)

Antes de tudo, instale Git, Node.js e ative o Yarn (via Corepack). Guia detalhado, com link de download e como confirmar cada instalação: [`docs/pre-requisitos.md`](./docs/pre-requisitos.md).

Resumo rápido, se você já sabe o que está fazendo:

```bash
git --version                 # já deve estar instalado
node -v                       # precisa bater com a versão em .nvmrc
corepack enable && yarn -v    # ativa o Yarn na versão travada no package.json
```

### 2. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd AmeMais
```

> Peça a URL do repositório para o tech lead se ainda não tiver acesso ao GitHub do projeto.

### 3. Instalar as dependências

```bash
yarn install
```

Isso instala as dependências de todos os apps (`apps/web-public`, `apps/web-admin`, `apps/web-example`, `apps/api`) e `packages/*` de uma vez só (é um monorepo com Yarn workspaces — não precisa (e não deve) rodar `yarn install` dentro de cada pasta separadamente). Pode demorar alguns minutos na primeira vez.

### 4. Criar os arquivos de variáveis de ambiente

O projeto tem quatro aplicações separadas, cada uma com seu próprio `.env.local`:

```bash
cp apps/web-public/.env.local.example apps/web-public/.env.local
cp apps/web-admin/.env.local.example apps/web-admin/.env.local
cp apps/web-example/.env.local.example apps/web-example/.env.local
cp apps/api/.env.local.example apps/api/.env.local
```

Depois, abra os arquivos criados e preencha os valores:

- **`apps/web-public/.env.local`**, **`apps/web-admin/.env.local`**, **`apps/web-example/.env.local`**: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chaves públicas do projeto Supabase (a mesma para os três). `NEXT_PUBLIC_API_URL` já vem preenchido com `http://localhost:3001` (não precisa mudar em dev local).
- **`apps/api/.env.local`**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_JWT_SECRET` — chaves privadas do backend (**nunca commitar nem compartilhar fora da equipe**). `ALLOWED_ORIGIN` já vem preenchido com `http://localhost:3000` (origem do `apps/web-example` em dev).

Peça essas chaves ao tech lead (elas ficam no painel do projeto no Supabase, em *Project Settings → API*). Sem elas, o `apps/api` sobe normalmente, mas qualquer chamada que dependa do Supabase falha.

> Os arquivos `.env.local` nunca vão para o Git (estão no `.gitignore`) — cada pessoa da equipe mantém o seu localmente.

### 5. Rodar o projeto em desenvolvimento

```bash
yarn dev
```

Isso sobe todos os apps ao mesmo tempo (via Turborepo), cada um na sua porta fixa:

- **Portal Público** (`apps/web-public`): http://localhost:3002
- **Painel Admin** (`apps/web-admin`): http://localhost:3003
- **App de exemplo** (`apps/web-example`): http://localhost:3000
- **Backend** (`apps/api`): http://localhost:3001 — confirme que está no ar acessando http://localhost:3001/api/health, deve retornar um JSON de sucesso.

Para parar os processos, use `Ctrl+C` no terminal.

**Como saber se deu tudo certo:** abra http://localhost:3000 no navegador — a página deve carregar sem erro. Se abrir o console do navegador (F12) e não houver erros de rede batendo em `localhost:3001`, o frontend e o backend estão conversando corretamente.

### 6. Outros comandos úteis

Rodados a partir da raiz do projeto (o Turborepo já aplica o comando nos dois apps):

```bash
yarn build        # build de produção de todos os apps
yarn lint         # checa lint (ESLint) em tudo
yarn type-check   # checa tipos (TypeScript) em tudo
yarn test         # roda os testes automatizados (Vitest, hoje só em apps/api)
```

**Rode `yarn lint`, `yarn type-check` e `yarn test` antes de abrir um Pull Request** — o CI do GitHub Actions roda essas mesmas checagens automaticamente em todo PR, então rodar local primeiro evita ida e volta.

Se quiser rodar um comando só em um app específico (em vez de todos), use o workspace do Yarn:

```bash
yarn workspace @amemais/web-admin dev
yarn workspace @amemais/api test
```

### 7. Banco de dados (migrations do Supabase)

O schema do banco fica versionado em `supabase/migrations/`, e o projeto usa um banco Supabase remoto compartilhado pela equipe (não é preciso rodar Postgres localmente). Pré-requisito: Supabase CLI instalado e logado — veja [`docs/pre-requisitos.md`](./docs/pre-requisitos.md#4-supabase-cli).

```bash
supabase link --project-ref <ref-do-projeto>   # uma vez por pessoa, nesta máquina
supabase db push                                # aplica migrations pendentes no banco remoto
```

O `<ref-do-projeto>` você pega com o tech lead (é o identificador do projeto no painel do Supabase).

Para criar uma migration nova:

```bash
supabase migration new nome_da_migration
# edite o arquivo .sql gerado em supabase/migrations/
supabase db push
```

Nunca edite uma migration já aplicada/commitada — crie uma nova para corrigir algo.

### 8. VS Code: TypeScript do projeto

Se o editor mostrar erros que o build não mostra (ex.: erro de JSX em `.tsx`), o `.vscode/settings.json` já resolve isso. Ao abrir o projeto:

1. Abra um arquivo `.ts`/`.tsx`.
2. Se aparecer aviso sobre versão do TypeScript do workspace, clique em **"Allow"**.
3. Se persistir: `Ctrl+Shift+P` → `TypeScript: Restart TS Server`.

### Problemas comuns

- **Porta já em uso**: feche o terminal anterior ou mate o processo usando a porta 3000/3001/3002/3003.
- **Erro de Supabase/env**: confira se preencheu os dois `.env.local` (passo 4).
- **`yarn -v` mostra versão diferente da esperada**: feche e reabra o terminal depois de `corepack enable`, ou rode `corepack prepare yarn@1.22.22 --activate` dentro da pasta do projeto.
- **`supabase db push` pede senha do banco / dá 403**: confirme que rodou `supabase login` e `supabase link --project-ref <ref>` primeiro (passo 7).
- **Mudança em `packages/shared-types` não refletiu**: reinicie o `yarn dev`.
- **Editor aponta erro de tipo que o `yarn type-check` não mostra (ou vice-versa)**: veja a seção de VS Code acima — geralmente é o TS Server do editor desatualizado.

## Licença

Este projeto foi feito para uso da **ONG AmeMais**, sem fins lucrativos. O código **não pode ser vendido nem usado comercialmente** — pode ser usado, estudado e modificado livremente para fins não comerciais. Detalhes em [`LICENSE.md`](./LICENSE.md).
