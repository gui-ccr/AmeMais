# Pré-requisitos do ambiente

Ferramentas que precisam estar instaladas no computador **antes** de clonar o projeto. Siga na ordem — cada seção tem o link oficial de instalação, o comando de instalação mais comum e como confirmar que deu certo.

> Este guia assume Windows, mas indica a alternativa para macOS/Linux em cada item.

## 1. Git

Usado para clonar o repositório e controlar versão do código.

- **Instalar:**
  - Windows: baixe em https://git-scm.com/downloads e execute o instalador (pode manter todas as opções padrão).
  - macOS: `brew install git` (ou instale o Xcode Command Line Tools: `xcode-select --install`).
  - Linux (Debian/Ubuntu): `sudo apt install git`.
- **Confirmar instalação:**
  ```bash
  git --version
  # esperado: git version 2.x.x
  ```
- **Configurar identidade** (uma vez por máquina — necessário para os commits terem seu nome/e-mail):
  ```bash
  git config --global user.name "Seu Nome"
  git config --global user.email "seu-email@exemplo.com"
  ```
- Você também vai precisar de uma conta no GitHub (https://github.com/signup) para clonar/contribuir com o repositório — veja [`github-workflow.md`](./github-workflow.md) para o fluxo de branches e PR.

## 2. Node.js

Runtime que executa o projeto (frontend e backend são apps Next.js).

- **Versão exigida:** a que está fixada em [`.nvmrc`](../.nvmrc) na raiz do projeto (hoje, Node 22 — sempre confira o arquivo, pois pode mudar).
- **Instalar (recomendado — via gerenciador de versões, evita conflito com outros projetos que usem outra versão de Node):**
  - Windows: instale o [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) (baixe o `nvm-setup.exe` do release mais recente).
    ```powershell
    nvm install 22
    nvm use 22
    ```
  - macOS/Linux: instale o [nvm](https://github.com/nvm-sh/nvm#installing-and-updating):
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    nvm install 22
    nvm use 22
    ```
- **Alternativa mais simples (sem gerenciador de versões):** baixe o instalador LTS direto em https://nodejs.org — só recomendado se você não trabalha com outros projetos Node que exijam outra versão.
- **Confirmar instalação:**
  ```bash
  node -v
  # esperado: v22.x.x (compatível com o .nvmrc)
  ```

## 3. Yarn (via Corepack)

Gerenciador de pacotes do monorepo (workspaces). **Não instale o Yarn direto com `npm install -g yarn`** — o projeto usa o Corepack, que já vem junto com o Node.js e garante que todo mundo usa exatamente a mesma versão do Yarn (fixada em `package.json` → `"packageManager"`).

- **Ativar o Corepack** (uma vez por máquina):
  ```bash
  corepack enable
  ```
  - No Windows, se der erro de permissão, rode o terminal (PowerShell) como Administrador só para esse comando.
- **Confirmar instalação:**
  ```bash
  yarn -v
  # esperado: 1.22.22 (a versão travada no package.json do projeto)
  ```
  Se aparecer uma versão diferente ou der erro, feche e reabra o terminal, ou rode `corepack prepare yarn@1.22.22 --activate` dentro da pasta do projeto (depois de cloná-lo).

## 4. Supabase CLI

Necessário **apenas** para quem for mexer no banco de dados (criar/aplicar migrations em `supabase/migrations/`). Se você só for trabalhar no frontend consumindo a API já pronta, pode pular esta etapa por enquanto.

- **Instalar:**
  - Windows: `npm install -g supabase` (ou via [Scoop](https://scoop.sh/): `scoop install supabase`).
  - macOS: `brew install supabase/tap/supabase`.
  - Linux: veja as opções em https://supabase.com/docs/guides/cli/getting-started
- **Confirmar instalação:**
  ```bash
  supabase --version
  ```
- **Autenticar** (uma vez por máquina — abre o navegador para login):
  ```bash
  supabase login
  ```
- Depois de clonar o projeto, ainda é preciso rodar `supabase link` uma vez (veja o passo 6 do [`README.md`](../README.md)).

## 5. Editor de código

Qualquer editor serve. Se usar VS Code, o projeto já tem configurações e extensões recomendadas em `.vscode/` que o próprio editor sugere instalar ao abrir a pasta (ex: ESLint).

## Checklist final

Depois de instalar tudo, rode estes comandos e confirme que todos respondem sem erro:

```bash
git --version
node -v
yarn -v
supabase --version   # só se for mexer no banco
```

Se todos responderem, siga para a seção **"Como configurar o ambiente local"** no [`README.md`](../README.md).
