import type { Evento, EventoFormValues } from "../types";

/**
 * MOCK TEMPORÁRIO: dados em memória, sem persistência real (somem ao recarregar
 * a página). O back ainda não tem `/api/eventos` — quando existir, troque o
 * corpo destas funções por chamadas Axios ao `apps/api`, no mesmo formato de
 * `apps/web-example/src/features/_example-demo/services/example-service.ts`.
 * A assinatura (list/create/update/remove) já é a mesma que o service real vai ter,
 * então os hooks/componentes que consomem `eventoService` não precisam mudar.
 */

let eventos: Evento[] = [
  {
    id: crypto.randomUUID(),
    titulo: "Feira de Adoção - Praça Central",
    tipo: "Feira de Adoção",
    descricao: "Feira mensal de adoção com animais resgatados prontos para adoção.",
    dataEvento: "2026-09-13",
    local: "Praça Central, Teófilo Otoni",
    createdAt: new Date().toISOString(),
  },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const eventoService = {
  async list(): Promise<Evento[]> {
    const ordenados = [...eventos].sort((a, b) => a.dataEvento.localeCompare(b.dataEvento));
    return delay(ordenados);
  },

  async create(input: EventoFormValues): Promise<Evento> {
    const novo: Evento = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    eventos = [novo, ...eventos];
    return delay(novo);
  },

  async update(id: string, input: EventoFormValues): Promise<Evento> {
    let atualizado: Evento | undefined;
    eventos = eventos.map((evento) => {
      if (evento.id !== id) return evento;
      atualizado = { ...evento, ...input };
      return atualizado;
    });
    if (!atualizado) throw new Error("Evento não encontrado");
    return delay(atualizado);
  },

  async remove(id: string): Promise<void> {
    eventos = eventos.filter((evento) => evento.id !== id);
    return delay(undefined);
  },
};
