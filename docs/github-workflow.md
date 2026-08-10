# Como contribuir: fluxo de branches e Pull Request (PR)

Este guia explica o passo a passo para enviar qualquer mudança sua para o projeto. Ele existe porque a branch `main` está **protegida**: ninguém consegue dar `push` direto nela, nem fazer merge sozinho — só o tech lead aprova e mescla. Isso não é burocracia gratuita, é o que garante que o código que todo mundo usa (`main`) nunca quebre por um erro de alguém.

Se você nunca usou Git/GitHub em equipe antes, siga a ordem abaixo exatamente. Depois de fazer isso 2 ou 3 vezes, vira rotina.

## Ideia geral (antes dos comandos)

1. Você nunca trabalha direto na `main`.
2. Para cada mudança (uma feature, um ajuste, uma correção), você cria uma **branch nova** a partir da `main`.
3. Você faz commits nessa branch e sobe (`push`) ela para o GitHub.
4. No GitHub, você abre um **Pull Request (PR)**: um pedido para que suas mudanças sejam trazidas para a `main`.
5. O tech lead revisa o PR. Ele pode:
   - **Aprovar e fazer o merge** — sua mudança entra na `main`. 🎉
   - **Pedir ajustes** — você faz mais commits na mesma branch, eles aparecem automaticamente no mesmo PR.
   - **Recusar** — a mudança não entra (nesse caso ele vai explicar o motivo).
6. Depois que o PR é mesclado, sua branch já cumpriu o papel dela e pode ser deletada.

Pense na branch como um "rascunho isolado": você pode errar, fazer commit feio, testar coisa — nada disso afeta a `main` até o PR ser aprovado.

## Passo a passo

### 1. Atualize sua `main` local antes de começar

Sempre comece uma mudança nova a partir da versão mais recente da `main`, para evitar trabalhar em cima de código desatualizado.

```bash
git checkout main
git pull
```

### 2. Crie uma branch nova para a sua mudança

Nunca reutilize uma branch antiga para uma mudança diferente — crie uma branch por mudança/tarefa.

```bash
git checkout -b tipo/nome-curto-da-mudanca
```

Convenção de nome (facilita todo mundo entender o PR só pelo nome da branch):

- `feature/mural-adocao` — uma funcionalidade nova
- `fix/erro-login-supabase` — uma correção de bug
- `docs/atualiza-readme` — mudança de documentação
- `chore/ajusta-lint` — tarefa técnica que não é feature nem bug (config, dependência, etc.)

Use `-` para separar palavras, tudo minúsculo, sem acento e sem espaço.

### 3. Faça suas mudanças e comite

Trabalhe normalmente no código. Ao terminar uma parte que faz sentido isoladamente, comite:

```bash
git add .
git commit -m "mensagem curta e clara do que foi feito"
```

Pode (e deve) fazer vários commits pequenos em vez de um único gigante no final — fica mais fácil revisar e entender o histórico.

Exemplos de boas mensagens de commit:

- `adiciona filtro por espécie no mural de adoção`
- `corrige validação do formulário de contato`

Evite mensagens genéricas como `mudanças` ou `fix`.

### 4. Suba a branch para o GitHub

```bash
git push -u origin tipo/nome-curto-da-mudanca
```

O `-u` (só precisa na primeira vez que você sobe essa branch) faz o Git lembrar o destino, então nos próximos `push` dessa mesma branch basta rodar `git push`.

### 5. Abra o Pull Request (PR)

1. Entre no repositório no GitHub.
2. Vai aparecer um banner "Compare & pull request" para a branch que você acabou de subir — clique nele. (Se não aparecer, vá na aba **Pull requests** → **New pull request** e escolha sua branch como origem e `main` como destino.)
3. Preencha:
   - **Título**: resumo curto da mudança (pode ser igual ao nome da branch, escrito de forma legível).
   - **Descrição**: o que foi feito e por quê. Se resolve alguma tarefa/issue combinada, mencione. Se for algo visual, vale colar um print.
4. Clique em **Create pull request**.

A partir daqui, o PR é o lugar onde a conversa sobre essa mudança acontece — não mais o chat da equipe.

### 6. Aguarde a revisão do tech lead

O tech lead vai olhar o PR e pode deixar comentários direto nas linhas do código, aprovar, ou pedir mudanças.

**Se ele pedir ajustes:** não abra um PR novo. Continue na mesma branch:

```bash
# faça as correções pedidas no código
git add .
git commit -m "ajusta conforme revisão"
git push
```

O PR já aberto atualiza sozinho com o novo commit.

### 7. Merge

Quando o tech lead aprovar, ele mesmo faz o merge para a `main` (é assim porque a `main` está protegida — só ele tem permissão de merge/push direto nela). Você não precisa fazer nada nesse momento.

### 8. Depois do merge

Volte para a `main`, atualize e comece a próxima mudança do zero (passo 1 outra vez):

```bash
git checkout main
git pull
```

Se quiser, pode deletar sua branch local antiga (ela já cumpriu a função):

```bash
git branch -d tipo/nome-curto-da-mudanca
```

## Regras importantes (resumo)

- ❌ Nunca dê `git push` direto na `main` — vai dar erro, porque ela está protegida. Isso é esperado, não é bug.
- ❌ Nunca faça merge do seu próprio PR — só o tech lead aprova/mescla.
- ✅ Uma branch por mudança, criada a partir da `main` atualizada.
- ✅ Commits pequenos e com mensagem clara.
- ✅ Antes de abrir o PR, rode `yarn lint` e `yarn type-check` (veja o [README principal](../README.md)) — evita comentários de revisão sobre erro óbvio.

## Erros comuns

- **"failed to push some refs" / "updates were rejected"**: alguém mudou a `main` (ou sua branch remota) depois que você começou. Rode `git pull` na sua branch (ou `git pull --rebase` se preferir histórico mais limpo) e resolva conflitos se aparecerem, depois `git push` de novo.
- **Tentei dar push na `main` e deu erro de permissão**: é esperado, a `main` é protegida. Crie uma branch (passo 2) e abra um PR.
- **Abri PR errado (branch errada, destino errado)**: dá pra editar a branch de destino/origem na própria página do PR, ou fechar o PR e abrir outro certo — sem problema.
