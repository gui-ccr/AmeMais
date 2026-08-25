# Documentação de arquitetura — AmeMais

Esta pasta guarda o registro das decisões de arquitetura do projeto, no formato ADR (Architecture Decision Record): uma decisão por arquivo, com contexto, alternativas consideradas, trade-offs e o motivo principal da escolha.

Objetivo: qualquer pessoa do time (principalmente quem está entrando agora) consegue entender não só *o que* foi decidido, mas *por que* — sem precisar perguntar no chat.

## Índice

| ADR | Decisão |
| --- | --- |
| [0001](./decisions/0001-separacao-web-api.md) | Separar `apps/web` e `apps/api` em vez de um único app Next.js |
| [0002](./decisions/0002-arquitetura-backend-layered-feature-based.md) | Arquitetura do backend: layered feature-based |
| [0003](./decisions/0003-frontend-feature-based.md) | Organização do frontend: feature-based |
| [0004](./decisions/0004-turborepo-yarn-workspaces.md) | Turborepo + Yarn workspaces para o monorepo |
| [0005](./decisions/0005-stack-principal.md) | Stack principal do projeto |
| [0006](./decisions/0006-storage-fotos-animais.md) | Supabase Storage para fotos de animais |
| [0007](./decisions/0007-separacao-frontend-publico-admin.md) | Separar o frontend em `apps/web-public` e `apps/web-admin` |
| [0008](./decisions/0008-apps-web-vira-web-example.md) | Migrar auth/admin para `apps/web-admin` e renomear `apps/web` → `apps/web-example` |

## Como adicionar um novo ADR

1. Crie um arquivo `NNNN-titulo-curto.md` em `docs/decisions/`, com `NNNN` sequencial.
2. Siga a mesma estrutura dos ADRs existentes: Contexto, Decisão, Alternativas consideradas, Trade-offs, Motivo principal.
3. Adicione a linha na tabela acima.
