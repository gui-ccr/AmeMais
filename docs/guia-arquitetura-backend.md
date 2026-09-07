# Guia de arquitetura e boas práticas — backend (`apps/api`)

Este guia explica, de forma bem direta, **cada peça da arquitetura do backend**: por que ela existe, o que ela evita, e o que acontece se você não usar. Cada tópico segue o mesmo formato:

> **O que é** (1-2 frases) → **❌ Sem o padrão** (como o código costuma nascer, e por que isso fica pior conforme o projeto cresce) → **✅ Com o padrão** (o que já está implementado no AmeMais, com o caminho do arquivo).

O exemplo vivo de tudo isso é a feature `animals`, em [`apps/api/src/features/animals`](../apps/api/src/features/animals) — sempre que um tópico apontar pra um arquivo, é lá.

---

## 1. A arquitetura em camadas

**O que é:** o pedido HTTP passa por uma fila de responsabilidades, uma de cada vez, sempre na mesma ordem — cada camada só fala com a de baixo, nunca pula etapa:

```
routes.ts → controller → use case → repository → banco
```

- `routes.ts` (dentro da própria feature) — tabela de endpoints: verbo HTTP → método do controller. É reexportado por `apps/api/app/api/<feature>/route.ts` só porque o Next.js exige o arquivo físico ali; esse arquivo em `app/` não tem lógica nenhuma.
- `controller` — lê a requisição (headers, params, body), confere autenticação, valida **formato** com Zod, chama o use case, formata a resposta.
- `use case` — aplica a **regra de negócio**, chama o repository.
- `repository` — é o único lugar que sabe falar com o Supabase.

### ❌ Sem o padrão

Um jeito comum de começar um projeto pequeno é escrever tudo direto no handler da rota:

```ts
// app/api/animais/route.ts — TUDO num arquivo só
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: user } = await supabase.auth.getUser(token);
  if (!user) return new Response("Não autorizado", { status: 401 });

  const body = await req.json();
  if (!body.nome || body.nome.length < 2) {
    return new Response("nome inválido", { status: 400 });
  }
  if (body.status === "adotado") {
    return new Response("não pode nascer adotado", { status: 400 });
  }

  const { data, error } = await supabase.from("animais").insert({
    nome: body.nome,
    status_adocao: body.status ?? "disponivel",
  }).select().single();

  if (error) return new Response("erro", { status: 500 });
  return Response.json({ id: data.id, nome: data.nome, status: data.status_adocao });
}
```

**Por que isso piora com o tempo:** esse arquivo mistura autenticação, validação de formato, regra de negócio e SQL. Pra testar a regra "não pode nascer adotado" você precisa simular uma requisição HTTP inteira e ter um banco de dados rodando — não dá pra testar só a regra isolada. Se amanhã outro endpoint (um script de importação em lote, por exemplo) precisar da mesma regra, ela vai ser copiada e colada, e as duas cópias vão divergir com o tempo. E quanto mais features assim existirem, mais cada uma reinventa sua própria forma de validar e responder erro — nada é consistente entre elas.

### ✅ Com o padrão

O mesmo fluxo, cada responsabilidade isolada, testável e reutilizável:
`app/api/animals/route.ts` → `features/animals/routes.ts` → `controller.ts` (`AnimalController.create`) → `use-cases/create-animal.use-case.ts` → `animal.repository.ts`.

A regra "não pode nascer adotado" mora em UM lugar (`domain/animal.entity.ts`, `Animal.create()`) e qualquer código que queira criar um animal — API, script, teste — passa por ela e ganha a garantia de graça.

---

## 2. SOLID

Cada letra resolve um jeito específico de código travar conforme cresce. Não precisa decorar a definição formal — precisa reconhecer o cheiro do problema.

### S — Single Responsibility (uma única razão para mudar)

**❌ Sem o padrão:**
```ts
class Pedido {
  calcularTotal() { /* ... */ }
  salvarNoBanco() { /* SQL aqui dentro */ }
  enviarEmailConfirmacao() { /* SMTP aqui dentro */ }
  gerarPdfNotaFiscal() { /* geração de PDF aqui dentro */ }
}
```
Essa classe muda toda vez que a regra de cálculo muda, **ou** toda vez que o banco muda, **ou** toda vez que o provedor de e-mail muda, **ou** toda vez que o layout do PDF muda. Um dev mexendo no e-mail pode quebrar o cálculo sem querer, porque tudo está no mesmo lugar.

**✅ Com o padrão:** `AnimalRepository` ([`animal.repository.ts`](../apps/api/src/features/animals/animal.repository.ts)) só muda se a forma de persistir mudar. Se amanhã ele precisar mandar notificação, isso é responsabilidade de outra classe — não dele.

### O — Open/Closed (dá pra estender sem editar o que já existe e funciona)

**❌ Sem o padrão:**
```ts
function calcularDesconto(tipoCliente: string, valor: number) {
  if (tipoCliente === "vip") return valor * 0.8;
  if (tipoCliente === "regular") return valor * 0.95;
  // toda vez que aparece um tipo de cliente novo, alguém edita essa função
  // e corre o risco de quebrar os casos que já funcionavam
}
```

**✅ Com o padrão:** a matriz `ALLOWED_TRANSITIONS` em [`domain/animal-status.vo.ts`](../apps/api/src/features/animals/domain/animal-status.vo.ts) — adicionar um novo status é adicionar uma entrada no mapa, sem tocar na função `podeAlterarStatus` que já existe e já foi testada.

### L — Liskov Substitution (uma implementação alternativa não pode surpreender)

**❌ Sem o padrão:** um repository "fake" de teste que devolve `null` em vez de lançar erro quando não encontra um registro, enquanto o repository real lança `NotFoundError` — quem usa qualquer um dos dois precisa saber qual é qual, e testes passam por motivos diferentes do código real.

**✅ Com o padrão:** qualquer implementação de `IAnimalRepository` ([`animal.repository.ts`](../apps/api/src/features/animals/animal.repository.ts)) — a real com Supabase, ou uma fake em memória para teste — se comporta do mesmo jeito do ponto de vista de quem chama (o use case). Trocar uma pela outra não quebra nada.

### I — Interface Segregation (não force dependência do que não se usa)

**❌ Sem o padrão:** uma única função `checarPermissoes(req)` gigante que verifica login, cargo, plano de assinatura e limite de uso, mesmo quando um endpoint só precisa saber "o usuário está logado?".

**✅ Com o padrão:** `requireUser` (só autentica) e `requireRole` (autentica **e** checa cargo) são funções separadas ([`middleware/auth.ts`](../apps/api/src/middleware/auth.ts), [`middleware/rbac.ts`](../apps/api/src/middleware/rbac.ts)) — um controller usa só o que precisa.

### D — Dependency Inversion (a regra de negócio não deve depender do banco — os dois devem depender de um contrato)

**❌ Sem o padrão:**
```ts
class CriarAnimalUseCase {
  async executar(dados: any) {
    // chama o Supabase direto aqui dentro
    const { data } = await supabase.from("animais").insert(dados);
    return data;
  }
}
```
Trocar Supabase por outro banco significa reescrever a regra de negócio junto — os dois estão grudados.

**✅ Com o padrão:** `UpdateAnimalStatusUseCase` ([`use-cases/update-animal-status.use-case.ts`](../apps/api/src/features/animals/use-cases/update-animal-status.use-case.ts)) depende da interface `IAnimalRepository`, nunca da classe concreta `AnimalRepository`. Trocar o banco no futuro significa escrever uma nova implementação da interface — os use cases não mudam uma linha.

---

## 3. Padrões de projeto usados no AmeMais

Não precisa decorar a definição de livro (GoF) de cada um — o ganho é reconhecer o problema e saber que já existe uma solução conhecida, em vez de inventar uma na hora.

### Repository — esconder o banco atrás de um objeto com métodos de domínio

❌ **Sem:** cada use case monta sua própria query Supabase (`.from("animais").select(...)`) — se o nome da tabela ou coluna mudar, é preciso caçar e trocar em vários arquivos.

✅ **Com:** [`IAnimalRepository` / `AnimalRepository`](../apps/api/src/features/animals/animal.repository.ts) — um único lugar sabe o nome da tabela `animais` e das colunas.

### Factory / Factory Method — centralizar a criação de um objeto caro ou com regras próprias

❌ **Sem:** `new Cliente(dados)` espalhado pelo código, cada chamador lembrando na mão quais campos são obrigatórios — um esquece de validar e cria um cliente inválido.

✅ **Com:** [`Animal.create(input)`](../apps/api/src/features/animals/domain/animal.entity.ts) é o único portão de entrada pra criar um animal novo — quem chama não precisa lembrar as regras, elas estão dentro da factory. E [`getSupabaseAdmin()`](../apps/api/src/lib/supabase.ts) cria o client Supabase sob demanda (não no carregamento do módulo), pra não quebrar o build em ambiente sem as variáveis de ambiente.

### Adapter / Mapper — traduzir entre dois formatos sem que quem usa perceba

❌ **Sem:** o nome da coluna do banco (`status_adocao`, `snake_case`) vaza direto pra resposta da API, ou pior, os dois formatos aparecem misturados no mesmo objeto de resposta (`status_adocao` **e** `statusAdocao` juntos) — quem consome a API não sabe qual confiar.

✅ **Com:** [`mapper.ts`](../apps/api/src/features/animals/mapper.ts) é o único lugar que conhece o nome das colunas do Postgres — todo o resto do código só vê a entidade em `camelCase`.

### Value Object — um valor imutável e sempre válido, não uma string qualquer

❌ **Sem:** `animal.status` é uma string solta. Qualquer código pode fazer `animal.status = "adotado"` direto, pulando qualquer checagem de transição — o bug só aparece em produção, quando um animal "em tratamento" vira "adotado" sem passar pela liberação veterinária.

✅ **Com:** [`AnimalStatus`](../apps/api/src/features/animals/domain/animal-status.vo.ts) é uma classe imutável — só existe através de `AnimalStatus.from(valor)`, que valida contra os status possíveis. Duas instâncias com o mesmo valor são iguais (`.equals()`), e ela carrega o próprio comportamento de domínio (`.podeTransicionarPara(novoStatus)`), que consulta a matriz de transição encapsulada no mesmo arquivo. Não existe caminho pra um `AnimalStatus` inválido circular pela aplicação.

### DTO (Data Transfer Object) — o formato exato que atravessa uma fronteira, sem lógica

❌ **Sem:** a API devolve a entidade de domínio inteira, incluindo métodos e detalhes internos — ou pior, devolve a linha crua do banco, vazando nomes de coluna e campos que não deveriam ser públicos.

✅ **Com:** [`animal.dto.ts`](../apps/api/src/features/animals/animal.dto.ts) define exatamente os campos que a API expõe (`AnimalDTO`), montados pelo use case (`toAnimalDTO`) a partir da entidade — nunca a entidade nem a linha do banco chegam direto na resposta HTTP.

### Strategy — trocar um comportamento sem `if/else` interminável

❌ **Sem:**
```ts
function podeTransicionar(atual: string, novo: string) {
  if (atual === "disponivel" && novo === "adotado") return true;
  if (atual === "disponivel" && novo === "em_tratamento") return true;
  if (atual === "em_tratamento" && novo === "adotado") return false;
  // ... uma cadeia de if crescendo pra sempre, difícil de revisar de relance
}
```
✅ **Com:** a matriz `ALLOWED_TRANSITIONS` em [`domain/animal-status.vo.ts`](../apps/api/src/features/animals/domain/animal-status.vo.ts) — uma tabela de "de onde para onde pode ir", fácil de ler inteira e fácil de estender.

### Dependency Injection manual (via construtor) — receber dependências prontas em vez de criá-las

❌ **Sem:** um use case que faz `new AnimalRepository()` dentro de si mesmo — pra testar esse use case sem banco de dados de verdade, é preciso reescrever o próprio use case.

✅ **Com:** todo `*UseCase` recebe o repository no construtor (`new CreateAnimalUseCase(repository)`, em [`controller.ts`](../apps/api/src/features/animals/controller.ts)) — em teste, basta passar uma implementação fake de `IAnimalRepository`.

### Decorator / Middleware — adicionar comportamento em volta de uma função sem alterar seu miolo

❌ **Sem:** cada controller reimplementa sua própria checagem de token, copiada e colada — se uma cópia ficar desatualizada, vira um buraco de segurança silencioso.

✅ **Com:** [`requireUser`/`requireRole`](../apps/api/src/middleware/rbac.ts) chamados no início de cada método do controller; [`withCors`](../apps/api/src/middleware/cors.ts) envolvendo toda resposta.

### Singleton — uma única instância compartilhada de algo caro

❌ **Sem:** cada requisição cria uma conexão nova com o banco (`new SupabaseClient(...)`), desperdiçando recursos e deixando a aplicação mais lenta sob carga.

✅ **Com:** o `Proxy` em [`src/lib/supabase.ts`](../apps/api/src/lib/supabase.ts) cria o client uma única vez e reaproveita em todas as chamadas.

### Facade — uma função simples escondendo uma sequência de passos mais complexa

❌ **Sem:** cada controller monta a resposta HTTP na mão (`new Response(JSON.stringify(...), { headers: {...}, status: ... })`), e o formato da resposta de erro varia de endpoint pra endpoint.

✅ **Com:** [`ok()`/`created()`/`fail()`](../apps/api/src/core/http.ts) escondem a montagem da resposta — toda a API responde no mesmo formato.

---

## 4. DDD (Domain-Driven Design), a parte que compensa usar aqui

### Entidade rica vs. objeto anêmico

**Objeto anêmico** = só carrega dados, sem regra nenhuma — a regra fica espalhada em quem usa o objeto.

❌ **Sem:**
```ts
interface Animal { id: string; status: string; }

// em algum use case, meses depois, escrito por outra pessoa:
animal.status = "adotado"; // ninguém checou se essa transição faz sentido
await repository.save(animal);
```
Nada impede esse código de existir. A regra de negócio "não pode pular de em_tratamento pra adotado direto" só existe se **todo mundo lembrar** de checar antes de mudar o campo — e mais cedo ou mais tarde, alguém esquece.

✅ **Com (entidade rica):** [`Animal.changeStatus()`](../apps/api/src/features/animals/domain/animal.entity.ts) é o único jeito de mudar o status — o campo é privado, ninguém consegue setar direto. A regra está garantida pelo próprio objeto, não pela memória de quem escreve o código.

### Value Object (retomando a seção 3, sob a lente do DDD)

Um Value Object representa "um valor com significado de negócio", não um dado solto — ver [`AnimalStatus`](../apps/api/src/features/animals/domain/animal-status.vo.ts) acima. A diferença central pra uma Entidade: uma entidade tem identidade (dois animais com o mesmo nome ainda são animais diferentes, por causa do `id`); um Value Object não — dois `AnimalStatus` com o mesmo valor **são o mesmo valor**, não importa onde vieram.

---

## 5. Organização de pastas: feature-based vs. "uma pasta por tipo de arquivo"

**❌ Organização por tipo** (o jeito mais comum de um projeto pequeno crescer sem querer):

```
src/
  controllers/
    AnimalController.ts
    UsuarioController.ts
    DoacaoController.ts
    EventoController.ts
    ... (mais 30 arquivos aqui dentro)
  usecases/
    CriarAnimalUseCase.ts
    AtualizarUsuarioUseCase.ts
    ... (mais 40 arquivos)
  repositories/
    AnimalRepository.ts
    ... (mais 20 arquivos)
```

**Por que isso piora conforme o projeto cresce:** pra entender ou mudar UMA feature (ex.: animais), é preciso abrir 4-5 pastas diferentes e caçar os arquivos com o nome certo no meio de dezenas de outros que não têm nada a ver. Ninguém consegue olhar pra `controllers/` e saber quais desses 30 arquivos ainda são usados, quais estão abandonados, quais dependem de quais. Duas pessoas mexendo em features diferentes (animais e doações) esbarram uma na outra só porque os arquivos delas moram nas mesmas pastas compartilhadas. Ao apagar uma feature inteira, sempre sobra lixo espalhado (um arquivo esquecido numa dessas pastas gigantes) porque nada sinaliza "isso tudo é da mesma feature, vai junto".

**✅ Feature-based (o que o AmeMais usa):**

```
src/features/
  animals/
    domain/
      animal.entity.ts          # entidade Animal (identidade + regra)
      animal-status.vo.ts        # Value Object AnimalStatus + matriz de transição
    schema.ts                  # validação Zod + DTOs de entrada
    mapper.ts                   # linha do banco <-> entidade
    animal.dto.ts                # DTO de saída
    animal.repository.ts          # acesso a dados (interface + implementação)
    use-cases/*.use-case.ts        # 1 classe por ação
    controller.ts                   # 1 método por endpoint
    routes.ts                        # endpoint HTTP -> método do controller
  events/
    ...

app/api/animals/route.ts        # exigido pelo Next.js: só reexporta features/animals/routes.ts
app/api/animals/[id]/route.ts
```

Só `dto`, `repository` e `use-cases` viram pasta quando têm mais de um arquivo — se a feature só precisa de 1 DTO ou 1 repository, ele mora solto na raiz da feature (`animal.dto.ts`, não `dto/animal.dto.ts`). Menos pasta pra abrir pra achar a mesma coisa.

Tudo que muda junto (uma feature) mora fisicamente junto. Pra criar uma feature nova, copia-se uma pasta parecida inteira e adapta — não é preciso decidir em qual de 6 pastas compartilhadas cada novo arquivo entra. Apagar uma feature é apagar uma pasta. Duas pessoas em features diferentes praticamente nunca têm conflito de merge.

O único arquivo que fica fora da feature é o exigido pelo roteamento por arquivos do Next.js (`app/api/animals/route.ts`), e ele só reexporta o que a feature já define em `routes.ts` — não tem lógica própria.

---

## 6. Clean Code — reduz bug, não é estilo

- **Nomes que dizem o que fazem sem precisar ler o corpo**: `podeAlterarStatus`, não `check`. Evite abreviação que só faz sentido pra quem escreveu.
- **Funções pequenas, um nível de abstração por vez**: um controller não deveria ter query SQL misturada com 40 linhas de `try/catch` — extraia.
- **Sem efeito colateral escondido**: uma função chamada `getAnimal` não deveria mudar o status do animal como "efeito colateral" — se muda estado, o nome tem que deixar isso óbvio (`changeStatus`).
- **Erro explícito, nunca silencioso, e nunca vazando detalhe interno**: nunca cair silenciosamente de uma chave de acesso privilegiada pra uma pública "pra garantir que funciona" — se falta configuração, `throw` alto e cedo. E nunca repassar a mensagem crua de um erro de infra (banco, storage) pro cliente: [`core/errors.ts`](../apps/api/src/core/errors.ts) define classes como `DatabaseError`/`StorageError` com mensagem pública **fixa**; o erro real vira `cause`, só pra log — nunca serializado na resposta HTTP.
- **Comentário só quando o "porquê" não é óbvio**: `domain/animal-status.vo.ts` é um bom exemplo — os comentários explicam a *razão de negócio* de cada transição bloqueada, não o que a linha faz.
- **DRY com moderação**: duplicar 3 linhas parecidas é melhor que criar uma abstração genérica cedo demais. Extraia quando o padrão já apareceu 3 vezes e está claro, não antes.
- **Validação na borda, uma vez só**: `schema.ts` valida formato na entrada da API; código interno (`use case`, `entidade`, `repository`) confia no dado já validado — não repita a mesma checagem em toda camada.

---

## Referências internas

- [ADR 0002 — Arquitetura do backend: layered feature-based](./decisions/0002-arquitetura-backend-layered-feature-based.md)
- [ADR 0003 — Organização do frontend: feature-based](./decisions/0003-frontend-feature-based.md)
- Exemplo de referência: [`apps/api/src/features/animals`](../apps/api/src/features/animals)
- Exemplo mínimo pré-existente: [`apps/api/src/features/_example-demo`](../apps/api/src/features/_example-demo)
