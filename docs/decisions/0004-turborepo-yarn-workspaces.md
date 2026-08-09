# 0004 — Turborepo + Yarn workspaces para o monorepo

## Contexto

Com `apps/web` e `apps/api` (ADR [0001](./0001-separacao-web-api.md)) mais os pacotes compartilhados (`packages/shared-types`, `packages/eslint-config`, `packages/typescript-config`), era preciso escolher como gerenciar dependências e orquestrar tasks (dev, build, lint) entre os workspaces.

## Decisão

- **Yarn workspaces** resolve as dependências entre os pacotes do monorepo (ex.: `apps/web` e `apps/api` apontando para `@amemais/shared-types` local).
- **Turborepo** orquestra as tasks (`dev`, `build`, `lint`, `type-check`) entre os workspaces, com cache de build.

## Alternativas consideradas

- **Apenas Yarn workspaces, sem Turborepo**: mais simples, sem camada extra de configuração — suficiente para monorepos pequenos, mas sem cache de build/lint entre os apps e sem paralelização automática das tasks.
- **Outras ferramentas de monorepo** (Nx, pnpm workspaces, Lerna): Nx tem integração forte com Next.js mas adiciona uma camada de convenções própria mais pesada que o necessário aqui; pnpm workspaces exigiria trocar o gerenciador de pacotes já definido no briefing (Yarn); Lerna hoje é menos indicado para esse caso de uso que Turborepo.

## Trade-offs

- Turborepo adiciona uma peça a mais de configuração (`turbo.json`) e mais um conceito para o time aprender.
- Em troca, dá cache de build/lint (relevante conforme os apps crescerem) e tem integração nativa com a Vercel, que é onde o projeto vai rodar.

## Motivo principal

Turborepo é o padrão de mercado para monorepos Next.js hospedados na Vercel, com custo de adoção baixo e ganho direto assim que o projeto crescer além do estado inicial.
