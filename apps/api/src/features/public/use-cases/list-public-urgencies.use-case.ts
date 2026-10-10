import type { PublicUrgency } from "@amemais/shared-types";
import { mapRowToPublicUrgency } from "../public-urgency.mapper";
import type { IPublicUrgencyRepository, PublicUrgencyRow } from "../public-urgency.repository";

const ORDEM_PRIORIDADE: Record<PublicUrgencyRow["prioridade"], number> = {
  urgente: 0,
  importante: 1,
  continua: 2,
};

/**
 * Urgências ativas na ordem do mural: prioridade (urgente, importante,
 * contínua), depois prazo mais próximo (sem prazo por último), depois as mais
 * novas. O banco guarda `prioridade` como texto, então a ordem é feita aqui.
 */
export class ListPublicUrgenciesUseCase {
  constructor(private readonly repository: IPublicUrgencyRepository) {}

  async execute(): Promise<PublicUrgency[]> {
    const rows = await this.repository.listActive();

    return [...rows]
      .sort((a, b) => {
        const porPrioridade = ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade];
        if (porPrioridade !== 0) return porPrioridade;

        if (a.data_limite !== b.data_limite) {
          if (a.data_limite === null) return 1;
          if (b.data_limite === null) return -1;
          return a.data_limite < b.data_limite ? -1 : 1;
        }

        return b.created_at.localeCompare(a.created_at);
      })
      .map(mapRowToPublicUrgency);
  }
}
