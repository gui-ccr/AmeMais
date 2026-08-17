# 0006 — Supabase Storage para fotos de animais

## Contexto

O Mural de Adoção (Portal Público) e a ficha de cada animal (Painel Admin) precisam exibir fotos. Era preciso decidir onde e como essas fotos ficam armazenadas.

## Decisão

Um bucket do Supabase Storage chamado `animal-photos`, **público para leitura**. Upload/remoção só acontece via `apps/api` (usando `supabaseAdmin`, a mesma service role key já usada para o Postgres), nunca direto do browser.

## Alternativas consideradas

- **Bucket privado com URL assinada**: mais controle de acesso, mas exige gerar/renovar URLs assinadas para toda foto exibida no Portal Público — complexidade sem benefício real aqui, já que fotos de animais para adoção são informação pública por natureza (é o objetivo do mural).

## Trade-offs

- Bucket público simplifica exibição no front (URL direta, sem lógica de assinatura), ao custo de qualquer pessoa com a URL poder ver a foto — aceitável, pois não é dado sensível.
- Upload centralizado no `apps/api` mantém a mesma regra do Postgres (ADR [0002](./0002-arquitetura-backend-layered-feature-based.md)): só o backend fala com o Supabase, front nunca recebe uma chave que permita escrever direto.

## Motivo principal

Fotos de animais disponíveis para adoção já são informação pública por definição do produto — não há razão para pagar a complexidade de URLs assinadas, e manter escrita centralizada no backend evita duplicar a lógica de autorização (RBAC) que já existe lá.
