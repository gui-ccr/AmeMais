# features/

Código de cada funcionalidade fica em `src/features/<feature>/`, com subpastas:

- `components/` — componentes específicos da feature
- `hooks/` — hooks específicos da feature
- `services/` — chamadas Axios ao `apps/api`
- `types.ts` — tipos específicos da feature

As páginas em `app/` ficam finas, só compondo o que vem daqui. Componente genérico de verdade (não pertence a nenhuma feature) vai em `src/components/ui/`.

Ver [ADR 0003 — Organização do frontend: feature-based](../../../../docs/decisions/0003-frontend-feature-based.md).

Exemplo de estrutura ao criar a primeira feature real:

```
src/features/adocao/
  components/
    adocao-card.tsx
  hooks/
    use-adocoes.ts
  services/
    adocao-service.ts
  types.ts
```
