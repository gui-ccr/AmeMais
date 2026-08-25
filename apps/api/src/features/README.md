# features/

Cada funcionalidade do backend vive em `src/features/<feature>/`, com camadas fixas (ver [ADR 0002](../../../../docs/decisions/0002-arquitetura-backend-layered-feature-based.md)):

- `route.ts` (em `app/api/<feature>/`, fora daqui) — handler HTTP fino, só liga o Next.js à feature.
- `controller.ts` — traduz request/response HTTP, chama o service, trata erros.
- `service.ts` — regra de negócio.
- `repository.ts` — única camada que fala com o Supabase (via `supabaseAdmin`).
- `schema.ts` — validação de entrada/saída com Zod.

Não criamos pastas por tipo (`controller/`, `service/`, `repository/` no topo) — cada camada já é um arquivo com uma responsabilidade só (SOLID/SRP já satisfeito arquivo a arquivo), e agrupar por feature evita misturar, na mesma pasta, arquivos de funcionalidades sem relação entre si (mesmo raciocínio da [ADR 0003](../../../../docs/decisions/0003-frontend-feature-based.md) do frontend) — além de reduzir conflito de merge quando o time trabalha em features diferentes ao mesmo tempo.

Código cross-cutting (não específico de uma feature) fica em `src/core/` (erros e formatação HTTP padronizados) e `src/middleware/` (CORS, auth, RBAC) — não em `src/features/`.

Veja `_example-demo/` como referência viva das 5 camadas em funcionamento (rota `/api/example-demo`, consumida pelo `apps/web-example`).
