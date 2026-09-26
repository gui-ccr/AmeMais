import { Urgency } from "../domain/urgency.entity";
import type { IUrgencyRepository } from "../urgency.repository";
import { toUrgencyDTO, type UrgencyDTO } from "../urgency.dto";
import type { CreateUrgencyDTO } from "../schema";

export class CreateUrgencyUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(input: CreateUrgencyDTO): Promise<UrgencyDTO> {
    // Urgency.create() valida as invariantes de domínio (ex.: valorArrecadado
    // <= metaArrecadacao) e devolve os dados já normalizados (titulo trimado,
    // defaults aplicados) — é esse resultado, não o input crú, que é persistido.
    const data = Urgency.create(input);

    const urgency = await this.repository.create(data);
    return toUrgencyDTO(urgency);
  }
}
