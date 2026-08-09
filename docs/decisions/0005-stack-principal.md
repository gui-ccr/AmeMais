# 0005 — Stack principal do projeto

## Contexto

Decisões de stack definidas no briefing inicial do projeto, registradas aqui para referência do time junto com as demais decisões de arquitetura.

## Decisão e motivo de cada escolha

- **Next.js (App Router)** como framework, tanto em `apps/web` quanto em `apps/api` — um único framework para o time inteiro aprender, com Route Handlers cobrindo a necessidade de backend sem introduzir um segundo framework/linguagem.
- **Vercel** para hospedagem — integração nativa com Next.js e Turborepo, deploy por push sem infraestrutura própria para manter (relevante para um time júnior sem experiência de operar infra).
- **Yarn** como gerenciador de pacotes — suporte a workspaces necessário para o monorepo.
- **Tailwind CSS + shadcn/ui** para estilização/UI — Tailwind evita CSS solto e inconsistente entre devs; shadcn/ui dá componentes prontos que ficam no próprio repo (não é uma dependência de UI fechada), então o time pode ajustar o código diretamente.
- **GSAP** para animações — biblioteca madura para animações mais elaboradas do que o que CSS/Framer Motion cobrem facilmente.
- **TanStack Query** para estado de servidor (cache, revalidação, loading/error state das chamadas à API) — evita reinventar cache/loading manualmente em cada componente.
- **Axios** como cliente HTTP — interceptors prontos (usados aqui para injetar o JWT do Supabase Auth em toda chamada ao `apps/api`, ver ADR [0001](./0001-separacao-web-api.md)).
- **Zod** para validação de dados no backend — garante que nada entra no banco sem ser validado, com tipos TS derivados automaticamente do schema.
- **Supabase Auth** para autenticação — sessão/JWT gerenciados pelo SDK oficial, sem implementar auth do zero.
- **Supabase** como banco de dados — Postgres gerenciado, com SDK que integra direto com o Supabase Auth.

## Trade-offs

Essas escolhas priorizam produtividade e curva de aprendizado baixa para um time júinor (menos peças para configurar do zero) em troca de menor controle fino de infraestrutura do que uma stack self-hosted daria — aceitável para o estágio atual do projeto.
