import type { Animal, NovoAnimalInput } from "../types";

/**
 * MOCK TEMPORÁRIO: dados em memória, sem persistência real (somem ao recarregar
 * a página). Quando o back estiver pronto, troque o corpo destas funções por
 * chamadas Axios (`@/lib/axios`) a `/api/animals`, no mesmo formato de
 * `features/eventos/services/evento-service.ts`.
 *
 * O que falta no back para essa troca funcionar por completo:
 * - upload de foto: não há endpoint (a API só aceita `urlFoto`, uma URL pronta);
 * - dados do adotante (nome, idade, CEP, localidade): a tabela `adotantes` só
 *   tem cpf/telefone/endereco ligados a `usuarios`;
 * - `POST /api/animals` não aceita `dataAdocao` (a coluna `data_adocao` existe).
 */

// Fotos de exemplo: as mesmas usadas nos dados de demonstração do portal público.
let animais: Animal[] = [
  {
    id: crypto.randomUUID(),
    nome: "Thor",
    especie: "cachorro",
    raca: "SRD (sem raça definida)",
    urlFoto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=700&q=70",
    adotante: { nome: "Maria Souza", idade: 34, cep: "39800-000", localidade: "Teófilo Otoni - MG" },
    dataAdocao: "2026-08-15",
    createdAt: "2026-08-15T12:00:00.000Z",
  },
  {
    id: crypto.randomUUID(),
    nome: "Frajola",
    especie: "gato",
    raca: "Siamês",
    urlFoto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=700&q=70",
    adotante: { nome: "João Pereira", idade: 41, cep: "39803-000", localidade: "Teófilo Otoni - MG" },
    dataAdocao: "2026-09-02",
    createdAt: "2026-09-02T12:00:00.000Z",
  },
  {
    id: crypto.randomUUID(),
    nome: "Mel",
    especie: "cachorro",
    raca: "Labrador",
    urlFoto: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=700&q=70",
    adotante: { nome: "Ana Ribeiro", idade: 27, cep: "39801-000", localidade: "Teófilo Otoni - MG" },
    dataAdocao: "2026-09-10",
    createdAt: "2026-09-10T12:00:00.000Z",
  },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Lê o arquivo como data URL, para a foto continuar visível na lista sem servidor de arquivos. */
function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível ler a foto enviada."));
    leitor.readAsDataURL(arquivo);
  });
}

export const animalService = {
  async list(): Promise<Animal[]> {
    const maisRecentesPrimeiro = [...animais].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return delay(maisRecentesPrimeiro);
  },

  async create(input: NovoAnimalInput): Promise<Animal> {
    const { foto, ...dados } = input;
    const novo: Animal = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      urlFoto: await lerComoDataUrl(foto),
      ...dados,
    };
    animais = [novo, ...animais];
    return delay(novo);
  },
};
