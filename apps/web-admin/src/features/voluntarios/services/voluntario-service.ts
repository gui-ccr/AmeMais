import { formatPhone } from "@/utils";
import type { EditarVoluntarioInput, NovoVoluntarioInput, Voluntario, VoluntarioDTO } from "../types";

/** Do formato da API para o modelo usado nas telas. A API manda o telefone só com dígitos; a tela recebe com máscara. */
export function paraVoluntario(dto: VoluntarioDTO): Voluntario {
  return {
    id: dto.id,
    nome: dto.nome,
    email: dto.email ?? "",
    telefone: formatPhone(dto.telefone),
    tipo: dto.tipo,
    status: dto.status,
    bairro: dto.bairro ?? "",
    areasDeAjuda: [...dto.areasDeAjuda],
    createdAt: dto.createdAt,
  };
}

/**
 * MOCK TEMPORÁRIO: dados em memória, no formato `VoluntarioDTO` (somem ao recarregar
 * a página). Quando o back criar a rota, troque o corpo destas funções por chamadas
 * Axios (`@/lib/axios`), como em `features/lares/services/lar-service.ts`:
 * `GET /api/voluntarios`, `GET /api/voluntarios/:id`, `POST /api/voluntarios` e
 * `PUT /api/voluntarios/:id` (corpo = `NovoVoluntarioInput`), todas respondendo
 * `{ data: VoluntarioDTO }` (ou `{ data: VoluntarioDTO[] }` na lista).
 *
 * Este formato (`nome`, `email`, `telefone` só com dígitos, `tipo`, `status`, `bairro`,
 * `areasDeAjuda`) foi adotado pelo time como referência para a API e a tabela, que ainda
 * não existem (back fora do escopo do front). O `tipo` no banco antigo é
 * 'Veterinário'/'Apoio Geral'; a API usa `veterinario`/`apoio_geral`.
 */

/**
 * `crypto.randomUUID` só existe em contexto seguro (https ou localhost): abrindo o admin
 * pelo IP da rede ele não existe. Por isso o id não é gerado no carregamento do módulo e
 * tem alternativa — o mock é temporário, a API real é quem vai gerar os ids.
 */
function gerarId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let voluntarios: VoluntarioDTO[] = [
  {
    id: "exemplo-voluntario-1",
    nome: "Mariana Souza (exemplo)",
    email: "mariana.exemplo@amemais.org",
    telefone: "33998765432",
    tipo: "apoio_geral",
    status: "ativo",
    bairro: "Centro",
    areasDeAjuda: ["lar_temporario", "eventos"],
    createdAt: "2026-09-20T14:00:00.000Z",
  },
  {
    id: "exemplo-voluntario-2",
    nome: "Dr. Paulo Lima (exemplo)",
    email: null,
    telefone: "3335210000",
    tipo: "veterinario",
    status: "ativo",
    bairro: null,
    areasDeAjuda: [],
    createdAt: "2026-09-12T10:30:00.000Z",
  },
  {
    id: "exemplo-voluntario-3",
    nome: "João Pedro Alves (exemplo)",
    email: null,
    telefone: "33988881111",
    tipo: "apoio_geral",
    status: "inativo",
    bairro: "São Jacinto",
    areasDeAjuda: ["transporte", "divulgacao"],
    createdAt: "2026-10-02T19:15:00.000Z",
  },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** O e-mail é único na tabela `usuarios` do banco; o mock recusa repetição do mesmo jeito. */
function garantirEmailLivre(email: string | null, idIgnorado?: string) {
  if (!email) return;

  const repetido = voluntarios.some(
    (voluntario) => voluntario.id !== idIgnorado && voluntario.email?.toLowerCase() === email.toLowerCase(),
  );
  if (repetido) throw new Error("Já existe um voluntário com este e-mail.");
}

function buscar(id: string): VoluntarioDTO {
  const encontrado = voluntarios.find((voluntario) => voluntario.id === id);
  if (!encontrado) throw new Error("Voluntário não encontrado.");
  return encontrado;
}

export const voluntarioService = {
  /** Em ordem alfabética de nome. */
  async list(): Promise<Voluntario[]> {
    const ordenados = [...voluntarios].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return delay(ordenados.map(paraVoluntario));
  },

  async get(id: string): Promise<Voluntario> {
    return delay(paraVoluntario(buscar(id)));
  },

  async create(input: NovoVoluntarioInput): Promise<Voluntario> {
    garantirEmailLivre(input.email);

    // `status` vem depois do spread: todo voluntário nasce ativo, mesmo que o objeto recebido traga outro.
    const novo: VoluntarioDTO = {
      id: gerarId(),
      createdAt: new Date().toISOString(),
      ...input,
      status: "ativo",
      areasDeAjuda: [...input.areasDeAjuda],
    };
    voluntarios = [...voluntarios, novo];
    return delay(paraVoluntario(novo));
  },

  /** `createdAt` e `status` ficam como estavam: o status muda por uma operação própria. */
  async update(id: string, input: EditarVoluntarioInput): Promise<Voluntario> {
    const atual = buscar(id);
    garantirEmailLivre(input.email, id);

    const atualizado: VoluntarioDTO = {
      ...atual,
      ...input,
      status: atual.status,
      areasDeAjuda: [...input.areasDeAjuda],
    };
    voluntarios = voluntarios.map((voluntario) => (voluntario.id === id ? atualizado : voluntario));
    return delay(paraVoluntario(atualizado));
  },
};
