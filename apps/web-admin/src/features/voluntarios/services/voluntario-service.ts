import type { EditarVoluntarioInput, NovoVoluntarioInput, Voluntario, VoluntarioDTO } from "../types";

/** Do formato da API para o modelo usado nas telas. */
export function paraVoluntario(dto: VoluntarioDTO): Voluntario {
  return {
    id: dto.id,
    nome: dto.nome,
    email: dto.email ?? "",
    telefone: dto.telefone,
    tipo: dto.tipo,
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
 * O que falta no back para essa troca funcionar (back fora do escopo do front):
 * - não existe rota de voluntários na API;
 * - a tabela `voluntarios` só tem `usuario_id` (chave e FK para `usuarios`, que nasce de
 *   uma conta de login), `telefone` e `tipo`. Ou seja: hoje só dá para ter voluntário
 *   que tem conta no sistema. Para a ONG cadastrar voluntários pelo painel, o back precisa
 *   decidir se a tabela ganha `id` próprio + `nome`/`email` (sem exigir conta) ou se o
 *   cadastro cria/convida um usuário. Também faltam `bairro`, `areas_de_ajuda`, `created_at`
 *   e a RLS (não há módulo "voluntarios" no RBAC).
 * - `tipo` no banco é 'Veterinário'/'Apoio Geral'; a API proposta usa `veterinario`/`apoio_geral`.
 */

let voluntarios: VoluntarioDTO[] = [
  {
    id: crypto.randomUUID(),
    nome: "Mariana Souza (exemplo)",
    email: "mariana.exemplo@amemais.org",
    telefone: "(33) 99876-5432",
    tipo: "apoio_geral",
    bairro: "Centro",
    areasDeAjuda: ["lar_temporario", "eventos"],
    createdAt: "2026-09-20T14:00:00.000Z",
  },
  {
    id: crypto.randomUUID(),
    nome: "Dr. Paulo Lima (exemplo)",
    email: null,
    telefone: "(33) 3521-0000",
    tipo: "veterinario",
    bairro: null,
    areasDeAjuda: [],
    createdAt: "2026-09-12T10:30:00.000Z",
  },
  {
    id: crypto.randomUUID(),
    nome: "João Pedro Alves (exemplo)",
    email: null,
    telefone: "(33) 98888-1111",
    tipo: "apoio_geral",
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

    const novo: VoluntarioDTO = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
      areasDeAjuda: [...input.areasDeAjuda],
    };
    voluntarios = [...voluntarios, novo];
    return delay(paraVoluntario(novo));
  },

  /** `createdAt` fica como estava. */
  async update(id: string, input: EditarVoluntarioInput): Promise<Voluntario> {
    const atual = buscar(id);
    garantirEmailLivre(input.email, id);

    const atualizado: VoluntarioDTO = { ...atual, ...input, areasDeAjuda: [...input.areasDeAjuda] };
    voluntarios = voluntarios.map((voluntario) => (voluntario.id === id ? atualizado : voluntario));
    return delay(paraVoluntario(atualizado));
  },
};
