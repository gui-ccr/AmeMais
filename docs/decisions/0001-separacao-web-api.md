# 0001 — Separar `apps/web` e `apps/api` em vez de um único app Next.js

## Contexto

O briefing inicial do projeto previa um único app Next.js "fullstack", usando Route Handlers/Server Actions como backend, com deploy unificado na Vercel. Ao planejar o setup inicial, entrou em jogo um fator novo: o time é composto por estudantes júnior, sem experiência de mercado, divididos em time de front e time de back, com um tech lead coordenando os dois.

## Decisão

O monorepo terá dois apps Next.js separados:

- `apps/web` — frontend (App Router, páginas/UI).
- `apps/api` — backend (App Router usado só como API, sem páginas de UI, expondo Route Handlers em `/api/*`).

Cada um é um deployable independente na Vercel, comunicando-se via HTTP (Axios no front, chamando os endpoints do back).

## Alternativas consideradas

- **App único Next.js** (front e back no mesmo processo, Route Handlers internos): era a proposta original do briefing. Mais simples de configurar e sem latência de rede entre front e back.

## Trade-offs

- **A favor da separação**: fronteira física de pastas/repositório entre os times, muito mais difícil de violar por engano do que a convenção `"use client"`/`"use server"` do Next dentro de um único app — relevante para um time júnior que ainda não tem o instinto de onde código server-only pode vazar para o bundle do client. Cada time trabalha só na sua pasta, com seu próprio `package.json`, deploy e ciclo de vida.
- **Contra a separação (custos aceitos)**: precisa de CORS configurado entre os dois apps, dois projetos na Vercel em vez de um, e propagação do JWT do Supabase Auth do `web` para o `api` via header `Authorization` em toda chamada. Essa complexidade é configurada uma única vez pelo tech lead, não é recorrente para o time.

## Motivo principal

Reduzir o risco de erro de um time júnior misturando responsabilidades de front e back, trocando uma convenção de código (que depende de disciplina) por uma fronteira física de pastas/apps (que é auto-explicativa e mais difícil de violar sem querer).
