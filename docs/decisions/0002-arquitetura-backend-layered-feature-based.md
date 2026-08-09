# 0002 — Arquitetura do backend: layered feature-based

## Contexto

O backend (`apps/api`) roda como Route Handlers do Next.js (Serverless Functions na Vercel), com Supabase como banco de dados e Zod para validação. Era preciso decidir como organizar o código de cada funcionalidade dentro do backend.

## Decisão

Cada funcionalidade vive em `apps/api/src/features/<feature>/`, com camadas fixas:

- `route.ts` (em `apps/api/app/api/<feature>/`) — handler HTTP fino, só liga o Next.js à feature.
- `controller.ts` — traduz request/response HTTP, chama o service, trata erros.
- `service.ts` — regra de negócio.
- `repository.ts` — única camada que fala com o Supabase (via `supabaseAdmin`).
- `schema.ts` — validação de entrada/saída com Zod.

## Alternativas consideradas

- **Clean Architecture** (entities, use-cases, interface-adapters, infra por feature): mais desacoplada e testável, mas exige bem mais boilerplate e disciplina de dependência entre camadas — compensa quando há regras de negócio complexas ou múltiplos consumidores do mesmo domínio, o que não é o caso aqui.
- **MVC**: não se encaixa bem porque não existe "View" no backend — o front é um app separado (`apps/web`). Forçar MVC aqui resultaria só em Model + Controller, perdendo a vantagem do padrão.

## Trade-offs

- Layered feature-based é mais simples e direto de aprender por quem nunca trabalhou em produção, com um caminho único e óbvio (route → controller → service → repository) para adicionar uma feature nova.
- Em compensação, é menos rígido sobre inversão de dependência do que Clean Architecture — se o projeto crescer muito em complexidade de negócio, pode ser necessário revisitar essa decisão.

## Motivo principal

Equilíbrio entre organização (nada de lógica solta em route handlers) e curva de aprendizado baixa para um time júnior, sem o overhead de Clean Architecture que não se paga no tamanho atual do projeto.
