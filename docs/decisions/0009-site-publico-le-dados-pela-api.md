# 0009 — O site público lê os dados pela `apps/api` (rotas públicas), com cache limpo sob demanda

## Contexto

O `apps/web-public` mostrava só dados fixos no código (animais, urgências e pontos de coleta). O PRD exige que o que a equipe muda no painel apareça no portal sem intervenção manual, então o site precisa passar a ler o banco.

Havia duas formas: o site ler o Supabase direto, com a chave `anon` protegida por RLS, ou chamar a `apps/api`. Hoje todas as rotas da API exigem login (usam `createSupabaseForUser` com o token do usuário), então não existe nenhuma rota para visitante anônimo.

## Decisão

O site público chama **rotas públicas da `apps/api`**, e não o Supabase direto:

- `GET /api/public/animais` — só animais `disponivel`, com lista fixa de campos
- `GET /api/public/urgencias` — só urgências ativas
- `GET /api/public/pontos-coleta` — só pontos ativos

As rotas públicas usam um client Supabase **anon, sem token** (nunca `supabaseAdmin`), então a RLS continua sendo a barreira no banco mesmo se o código da rota errar.

No site, as buscas rodam **só no servidor** (Server Components) pela função `apiGet` de `src/lib/api.ts`. A URL vem de `API_URL` (variável de servidor).

**Cache em duas camadas:**

1. **Sob demanda (caminho normal):** cada busca leva uma tag (`animais`, `urgencias`, `pontos-coleta`, em `src/lib/cache-tags.ts`). Quando algo muda no painel, a `apps/api` chama `POST /api/revalidate` no site com `{ "tags": [...] }` e o segredo `REVALIDATE_SECRET` no cabeçalho `x-revalidate-secret`. O Next descarta só aquele cache e a próxima visita já vê o dado novo. A rota só aceita as tags conhecidas e responde 503 se o segredo não estiver configurado.
2. **Prazo de segurança:** `revalidate` de **30 segundos** em toda busca, para o caso de o aviso falhar (API fora do ar, segredo errado).

O contrato das respostas fica em `packages/shared-types` (`src/public`). A API monta as respostas a partir desses tipos e o site valida o que recebe com os mesmos schemas.

## Alternativas consideradas

- **Site lendo o Supabase direto com a chave `anon`**: menos código e um salto a menos, e as policies de leitura pública já existem para animais, eventos e urgências. Mas abre uma exceção às ADRs [0001](./0001-separacao-web-api.md) e [0002](./0002-arquitetura-backend-layered-feature-based.md) ("só o backend fala com o Supabase"), espalha regras de segurança do banco para dentro do front e deixa a proteção dos dados do adotante dependendo só de RLS e views corretas.

## Trade-offs

- **A favor da API**: a regra de "o que é público" mora em um lugar só e é testável (um teste garante que dado de adotante nunca sai); mantém a fronteira das ADRs 0001 e 0002; o banco fica atrás da API.
- **Contra (custos aceitos)**: código novo no backend, um salto de rede a mais e mais um ponto que pode falhar. Mitigação: cache com prazo de segurança de 30 s (a página anterior continua sendo servida se a API cair, graças ao ISR) e tratamento de falha em cada tela.
- **Mais uma peça para manter**: a rota `/api/revalidate` e o segredo compartilhado entre `apps/web-public` e `apps/api`. Se o aviso falhar, a mudança aparece em até 30 s (desde que a API esteja no ar).
- **Rota pública com efeito**: `/api/revalidate` é a única rota do site que faz algo além de ler, por isso exige segredo, compara em tempo constante e só aceita tags conhecidas.

## Motivo principal

Manter o banco atrás da API e concentrar num único lugar, testável, a decisão do que um visitante pode ver, aceitando um pouco mais de código e um salto a mais.
