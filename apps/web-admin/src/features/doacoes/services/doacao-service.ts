import type { Doacao, EditarDoacaoInput, NovaDoacaoInput } from "../types";

/**
 * MOCK TEMPORÁRIO: dados em memória, sem persistência real (somem ao recarregar
 * a página). Quando o back estiver pronto, troque o corpo destas funções por
 * chamadas Axios (`@/lib/axios`) a `/api/doacoes`, no formato de
 * `features/eventos/services/evento-service.ts`.
 *
 * O que falta no back para essa troca funcionar (back fora do escopo do front):
 * - a API não tem rota de doações (só `POST /api/urgencias/:id/doacao`, que soma um
 *   valor na meta da urgência e não cria registro de doação);
 * - a tabela `doacoes` só tem `categoria`, `data_entrada`, `ponto_coleta_id` (FK, não
 *   o texto livre "onde foi coletada") e `nome/telefone/cpf_doador`. Faltam colunas para
 *   descrição, quantidade + unidade, vínculo com a urgência, foto e "registrado por"
 *   (hoje só existe aqui, no mock) — além da RLS e do upload da foto (como em `/api/uploads`).
 * - vincular a uma urgência aqui é só uma referência: NÃO soma nada no progresso da urgência.
 */

let doacoes: Doacao[] = [
  {
    id: crypto.randomUUID(),
    descricao: "6 sacos de ração filhote (15 kg cada)",
    quantidade: 90,
    unidade: "kg",
    categoria: "racao",
    localColeta: "Pet Shop Amigo Fiel",
    dataEntrada: "2026-10-01",
    urlFoto: null,
    urgenciaId: null,
    doadorNome: "Ana Paula M.",
    doadorTelefone: "(33) 99999-1234",
    doadorCpf: null,
    registradoPor: "Equipe AmeMais (exemplo)",
    createdAt: "2026-10-01T15:30:00.000Z",
  },
  {
    id: crypto.randomUUID(),
    descricao: "Mantas e cobertores usados, lavados",
    quantidade: 14,
    unidade: "un",
    categoria: "cobertores",
    localColeta: "Salão paroquial — Centro",
    dataEntrada: "2026-09-28",
    urlFoto: null,
    urgenciaId: null,
    doadorNome: null,
    doadorTelefone: null,
    doadorCpf: null,
    registradoPor: "Equipe AmeMais (exemplo)",
    createdAt: "2026-09-28T12:10:00.000Z",
  },
  {
    id: crypto.randomUUID(),
    descricao: "Doação via PIX",
    quantidade: 150,
    unidade: "R$",
    categoria: "dinheiro",
    localColeta: "Chave PIX da ONG",
    dataEntrada: "2026-09-25",
    urlFoto: null,
    urgenciaId: null,
    doadorNome: "Carlos H.",
    doadorTelefone: null,
    doadorCpf: null,
    registradoPor: "Equipe AmeMais (exemplo)",
    createdAt: "2026-09-25T18:45:00.000Z",
  },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Lê o arquivo como data URL, para a foto continuar visível sem servidor de arquivos. */
function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível ler a foto enviada."));
    leitor.readAsDataURL(arquivo);
  });
}

export const doacaoService = {
  /** Mais recentes primeiro: pela data de entrada e, no empate, pela hora do cadastro. */
  async list(): Promise<Doacao[]> {
    const ordenadas = [...doacoes].sort(
      (a, b) => b.dataEntrada.localeCompare(a.dataEntrada) || b.createdAt.localeCompare(a.createdAt),
    );
    return delay(ordenadas);
  },

  async create(input: NovaDoacaoInput): Promise<Doacao> {
    const { foto, ...dados } = input;
    const nova: Doacao = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      urlFoto: foto ? await lerComoDataUrl(foto) : null,
      ...dados,
    };
    doacoes = [nova, ...doacoes];
    return delay(nova);
  },

  /** `registradoPor` e `createdAt` ficam como estavam: são a auditoria do cadastro. */
  async update(id: string, input: EditarDoacaoInput): Promise<Doacao> {
    const atual = doacoes.find((doacao) => doacao.id === id);
    if (!atual) throw new Error("Doação não encontrada.");

    const { foto, ...dados } = input;
    const urlFoto = foto === undefined ? atual.urlFoto : foto === null ? null : await lerComoDataUrl(foto);
    const atualizada: Doacao = { ...atual, ...dados, urlFoto };

    doacoes = doacoes.map((doacao) => (doacao.id === id ? atualizada : doacao));
    return delay(atualizada);
  },
};
