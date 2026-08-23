# PRD — AmeMais (Plataforma Web)

> Este documento descreve **o quê** vamos construir e **por quê** — problema, usuários, requisitos e critérios de aceite do MVP. Para stack técnica, arquitetura detalhada e cronograma de sprints, veja [`arquitetura-e-roadmap.md`](./arquitetura-e-roadmap.md). Para as anotações originais que deram origem a este documento, veja [`anotacao_amemais.txt`](./anotacao_amemais.txt).

- **Status:** Em concepção / início de desenvolvimento
- **Parceiro:** ONG AMEMAIS (Teófilo Otoni – MG)
- **Contexto:** Projeto de extensão universitária (UCE), desenvolvido por uma equipe de estudantes
- **Site atual da ONG:** https://amemais.ueniweb.com/

## Resumo

A AMEMAIS atua na proteção animal em Teófilo Otoni, mas seu site atual não comunica isso: é engessado, não explica como doar ou entregar animais resgatados, e não mostra o histórico de ações da ONG. Este projeto substitui esse site por uma plataforma composta por dois módulos:

- **Portal Público** — atrai adotantes, doadores e voluntários, com informações claras sobre animais disponíveis, formas de ajudar e necessidades urgentes.
- **Painel Administrativo** — dá à ONG uma ferramenta real para gerenciar animais, lares temporários, voluntários e eventos, sem depender de planilhas soltas ou WhatsApp.

## 1. Problema

O diagnóstico do site atual (UENI Web) mostra falhas que prejudicam diretamente a missão da ONG:

1. **Formulários ineficientes** — confusos e mal estruturados, gerando abandono de quem quer adotar ou doar.
2. **Falta de informação básica** — não há explicação sobre pontos de coleta de doações físicas (ração, cobertores, remédios) nem sobre como/onde entregar um animal resgatado.
3. **Falta de transparência** — não existe histórico das ações já realizadas, então o visitante não sabe quais bairros/regiões a ONG atende nem como atua.
4. **Impacto direto** — a ausência dessas informações gera desconfiança, prejudicando arrecadação de fundos e resgates na cidade.

## 2. Por que agora (justificativa)

A AMEMAIS executa um trabalho essencial, mas sua infraestrutura digital atual joga contra a instituição: um site estático não responde a perguntas básicas da comunidade ("Onde posso entregar ração?", "Quais bairros a ONG atende?"), afastando apoio local. Este projeto existe para fechar essa lacuna de credibilidade, dando transparência real ao trabalho da ONG e aproximando a comunidade (acadêmica e geral) das necessidades concretas da proteção animal local.

## 3. Objetivos do produto

**Objetivo geral:** substituir o site atual por uma plataforma web que modernize a presença digital da AMEMAIS e melhore a gestão interna das suas atividades.

**Objetivos específicos:**

- Oferecer um portal público moderno, responsivo e fácil de entender para quem quer adotar, doar ou ajudar.
- Divulgar de forma organizada os animais disponíveis para adoção (fotos, informações básicas).
- Dar à equipe da ONG uma ferramenta para gerenciar animais, lares temporários, voluntários e eventos, sem depender de conhecimento técnico.
- Centralizar as informações da ONG em um banco de dados único, em vez de espalhadas em planilhas/mensagens.
- Reduzir a fricção nos processos de adoção, doação e contato com a instituição.
- Entregar algo que a ONG consiga manter e usar de verdade depois que o projeto de extensão terminar.

## 4. Personas

### 🐾 Adotante em potencial
Alguém da região de Teófilo Otoni interessado em adotar um animal. Hoje não consegue ver com clareza quais animais estão disponíveis nem como iniciar o processo — o site atual não passa confiança. Quer: navegar pelos animais disponíveis, filtrar por espécie/porte/idade, e saber como agir para adotar.

### 💜 Doador / apoiador
Pessoa que quer contribuir com dinheiro (PIX) ou itens físicos (ração, cobertores, remédios). Hoje não sabe onde entregar doações físicas nem se a ONG realmente precisa de algo específico naquele momento. Quer: uma forma rápida de doar (PIX com cópia fácil) e saber as "urgências da semana" antes de doar o que não é prioridade.

### 🤝 Voluntário / Colaborador fixo
Pessoa engajada que ajuda na rotina da ONG (cadastro de animais, cuidados, eventos) ou oferece a própria casa como lar temporário. Hoje esse trabalho é coordenado de forma informal. Quer: uma forma organizada de registrar o que está fazendo (ex: atualizar status de um animal) sem precisar de acesso a tudo do sistema.

### 👑 Coordenador / Admin (diretoria da ONG)
Responsável pela ONG como um todo, incluindo dados sensíveis (financeiro, gestão de usuários). Hoje não tem visão consolidada de animais, lares temporários e doações. Quer: controle total do sistema, relatórios e capacidade de gerenciar quem tem acesso a quê.

## 5. Escopo do MVP

> "Critério de aceite" abaixo significa: a condição mínima e verificável para considerar aquele requisito pronto — se a condição não é verdadeira, a funcionalidade não está terminada.

### 5.1 Portal Público

| Requisito | Critério de aceite |
|---|---|
| Home page moderna | Visitante vê a história da ONG, fotos em boa qualidade e pelo menos um botão de chamada para ação (ex: "Ver animais para adoção" ou "Doar agora"). |
| Mural de adoção | Visitante consegue ver a lista de animais disponíveis para adoção, com foto e informações básicas (nome, espécie, porte, idade). |
| Filtros do mural | Visitante consegue filtrar os animais por espécie, porte e idade. |
| Central de ajuda / doação | Visitante encontra a chave PIX da ONG com botão de cópia rápida e QR Code visível na página. |
| Urgências da semana | Visitante vê uma lista atualizada das necessidades urgentes da ONG (ex: "precisamos de 20kg de ração medicada"), atualizável pela equipe sem precisar de um dev. |

### 5.2 Painel Administrativo (acesso restrito)

| Requisito | Critério de aceite |
|---|---|
| Controle de animais | Colaborador/admin consegue cadastrar um animal com ficha básica (nome, espécie, status: resgatado / em lar temporário / adotado) e fazer upload de foto. |
| Sincronização com o portal | Ao atualizar status ou foto de um animal no painel, a mudança aparece no Portal Público sem intervenção manual adicional. |
| Rede de apoio (lares temporários) | Colaborador/admin consegue cadastrar um voluntário e associar qual animal está em qual lar temporário no momento. |
| Gestão de eventos | Colaborador/admin consegue cadastrar eventos internos (feirinhas de adoção, bazares) com data e descrição. |

## 6. Papéis de acesso (RBAC)

O sistema tem três níveis de permissão. Regras técnicas de segurança (RLS no banco) estão detalhadas em [`arquitetura-e-roadmap.md`](./arquitetura-e-roadmap.md) — aqui vai só o que cada papel pode *fazer*:

- **`admin`** (diretoria/fundadores): acesso total — inclui gestão de usuários e dados financeiros (doações).
- **`colaborador`** (voluntários fixos): pode cadastrar animais, atualizar o mural, atualizar pontos de coleta e gerenciar eventos. **Não** acessa o módulo financeiro.
- **`public`** (visitante anônimo): só lê o que é público — animais disponíveis para adoção, pontos de coleta, mural de ações.

## 7. Fora de escopo (MVP)

Para manter o MVP realista para uma equipe de estudantes em um semestre, os itens abaixo **não** entram nesta primeira versão — podem virar backlog futuro, mas não são compromisso deste projeto:

- Pagamento online automatizado (gateway de pagamento, split, conciliação automática) — doação via PIX continua manual (chave copiável), sem integração com banco.
- Aplicativo mobile nativo.
- Relatórios financeiros avançados/dashboards analíticos — o painel cobre gestão operacional, não BI.
- Notificações automáticas (e-mail/SMS/push) para adotantes ou doadores.
- Múltiplas ONGs/multi-tenant — o sistema é feito sob medida para a AMEMAIS.

## 8. Métricas de sucesso

Pensadas para serem simples de verificar e coerentes com uma equipe de estudantes construindo o primeiro produto real — não são metas de crescimento, são critérios de "o produto funciona e é usado":

- O Portal Público está publicado, acessível publicamente, e lista animais reais da ONG disponíveis para adoção.
- Alguém da equipe da AMEMAIS (não da equipe de dev) consegue cadastrar/atualizar um animal no painel sem ajuda técnica.
- A ONG consegue publicar pelo menos uma "urgência da semana" real através do sistema.
- O PIX e os pontos de coleta estão visíveis e corretos no portal.
- A liderança da AMEMAIS valida o sistema como um avanço real em relação ao site atual (aceite qualitativo, em reunião de apresentação final).

## 9. Metodologia de acompanhamento

Desenvolvimento incremental em sprints semanais, com Kanban dividido em `A Fazer`, `Em Desenvolvimento`, `Em Revisão` e `Pronto`, sob coordenação do Tech Lead.

## 10. Referências

- [`anotacao_amemais.txt`](./anotacao_amemais.txt) — anotações originais (fonte deste PRD).
- Site atual da ONG: https://amemais.ueniweb.com/
