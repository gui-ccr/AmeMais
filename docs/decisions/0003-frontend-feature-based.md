# 0003 — Organização do frontend: feature-based

## Contexto

O frontend (`apps/web`) usa Next.js App Router, cujas pastas em `app/` já definem as rotas. Era preciso decidir como organizar o código de UI/lógica que não é roteamento (componentes, hooks, chamadas à API).

## Decisão

Código de cada funcionalidade fica em `apps/web/src/features/<feature>/`, com subpastas `components/`, `hooks/`, `services/` (chamadas Axios ao `apps/api`) e `types.ts`. As páginas em `app/` ficam finas, só compondo o que vem de `features/`. Componentes verdadeiramente genéricos (primitivos shadcn/ui) ficam em `src/components/ui/`, fora de qualquer feature.

## Alternativas consideradas

- **Organização por tipo** (uma pasta `components/`, uma `hooks/`, uma `services/` para o projeto inteiro): mais comum em projetos pequenos, mas escala mal — em pouco tempo vira um monte de arquivos sem relação direta entre si, difícil de saber o que pertence a qual funcionalidade.

## Trade-offs

- Feature-based exige uma decisão inicial (a que feature isso pertence?) que às vezes não é óbvia para código realmente compartilhado — por isso a pasta `components/ui/` existe como válvula de escape para o que é genérico de verdade.
- Em compensação, cada feature fica autocontida: um dev consegue entender/mexer numa funcionalidade sem precisar caçar arquivos espalhados pelo projeto inteiro.

## Motivo principal

Mesmo raciocínio do backend: cada feature isolada em sua pasta reduz o acoplamento acidental entre partes do sistema e facilita dividir trabalho entre os devs do time de front sem pisar no código um do outro.
