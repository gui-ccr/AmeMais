# AmeMais

Monorepo do projeto AmeMais.

## Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, shadcn/ui, GSAP, TanStack Query, Axios
- **Backend**: Next.js (App Router, Route Handlers), Zod, Supabase Auth
- **Banco de dados**: Supabase
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
  migrations/ # schema do banco, versionado (ver seção "Banco de dados" abaixo)
```

`apps/web` e `apps/api` são dois apps Next.js separados (não um único app com front e back juntos). Veja o porquê dessa e das outras decisões de arquitetura em [`docs/`](./docs/README.md).

## Como rodar (passo a passo)

### 1. Instalar os pré-requisitos (só na primeira vez, uma vez por máquina)

- **Node.js**: instale a versão indicada em [`.nvmrc`](./.nvmrc). Baixe em https://nodejs.org (pegue a versão "LTS"). Para conferir se já está instalado: `node -v` no terminal.
- **Yarn**: com o Node já instalado, rode `corepack enable` no terminal (isso já deixa o Yarn disponível). Para conferir: `yarn -v`.
- **Editor**: recomendado VS Code, com a extensão "ESLint" instalada (ajuda a ver os erros de lint direto no editor).

### 2. Clonar o repositório e instalar as dependências

```bash
git clone <url-do-repositorio>
cd AmeMais
yarn install
```

`yarn install` lê os `package.json` de `apps/web`, `apps/api` e `packages/*` e baixa tudo de uma vez só (é assim que o monorepo funciona — não precisa rodar `yarn install` dentro de cada pasta separadamente).

### 3. Configurar as variáveis de ambiente

Cada app precisa de um arquivo `.env.local` com as credenciais do Supabase (esse arquivo é local, nunca vai pro Git — por isso não existe pronto no repositório, só o exemplo).

```bash
# na raiz do projeto:
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.local.example apps/api/.env.local
```

Depois abra os dois arquivos `.env.local` criados e preencha os valores (peça as chaves do projeto Supabase para o tech lead). Sem isso, o `apps/api` sobe mas as chamadas que usam o Supabase vão dar erro.

### 4. Rodar o projeto em desenvolvimento

```bash
yarn dev
```

Esse único comando sobe os dois apps ao mesmo tempo (é o Turborepo fazendo isso por baixo dos panos — veja a explicação no início da conversa/no `docs/`):

- Frontend: http://localhost:3000
- Backend (API): http://localhost:3001 — teste se está no ar abrindo http://localhost:3001/api/health, deve responder `{"status":"ok"}`

Para parar, `Ctrl+C` no terminal onde rodou `yarn dev`.

### 5. Outros comandos úteis

```bash
yarn build        # gera o build de produção dos dois apps (roda antes de deploy, ou pra checar se está tudo ok)
yarn lint         # checa problemas de estilo/código nos dois apps
yarn type-check   # checa erros de tipo do TypeScript nos dois apps
```

Rode `yarn lint` e `yarn type-check` antes de abrir um Pull Request — evita que erros óbvios cheguem na revisão de código.

### 6. Banco de dados (migrations do Supabase)

A estrutura do banco (tabelas, colunas, políticas de RLS) fica versionada em `supabase/migrations/`, no repositório — assim ninguém precisa criar tabela manualmente pelo dashboard do Supabase, e todo mundo do time roda exatamente o mesmo schema.

**Pré-requisito**: ter o [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) instalado (`npm install -g supabase`) e estar logado (`supabase login`, abre o navegador uma vez só).

```bash
# uma vez por pessoa, pra conectar o projeto local ao projeto remoto do Supabase:
supabase link --project-ref <ref-do-projeto>   # o ref está na URL do projeto no dashboard

# sempre que existirem migrations novas que você ainda não aplicou:
supabase db push
```

Para criar uma migration nova (ex.: uma tabela nova pra sua feature):

```bash
supabase migration new nome_da_migration
# edite o arquivo .sql gerado em supabase/migrations/ com o SQL da mudança
supabase db push   # aplica no banco remoto
```

Regra: nunca edite uma migration que já foi aplicada e já está no Git (outra pessoa do time já pode ter rodado). Se precisar corrigir algo, crie uma migration nova.

### 7. VS Code: usar a versão do TypeScript do projeto

O VS Code tem uma versão de TypeScript "embutida" no editor, diferente da versão instalada no projeto (`node_modules/typescript`). Se o editor usar a versão errada, ele pode não reconhecer configurações do projeto e mostrar erros que não existem de verdade (ex.: erro de JSX em todo arquivo `.tsx`, mesmo o projeto compilando certinho pelo terminal).

O arquivo `.vscode/settings.json` já resolve isso automaticamente. Só confira, ao abrir o projeto pela primeira vez:

1. Abra qualquer arquivo `.ts` ou `.tsx`.
2. Se aparecer um aviso no canto inferior direito perguntando sobre a versão do TypeScript do workspace, clique em **"Allow"**/**"Usar versão do workspace"**.
3. Se não aparecer nada e mesmo assim tiver erro estranho de JSX/tipos: `Ctrl+Shift+P` → digite `TypeScript: Restart TS Server` → Enter.

Isso resolve praticamente todo erro de "editor mostra erro mas o build passa".

### Problemas comuns

- **"porta já em uso" ao rodar `yarn dev`**: algum processo antigo ficou rodando. Feche o terminal anterior ou mate o processo que está usando a porta 3000/3001.
- **Erro relacionado a variável de ambiente/Supabase**: confira se copiou e preencheu o `.env.local` (passo 3) — é o erro mais comum ao rodar pela primeira vez.
- **Mudei algo em `packages/shared-types` e não refletiu no app**: pare o `yarn dev` e rode de novo — mudanças em pacotes compartilhados às vezes exigem reiniciar o processo.
