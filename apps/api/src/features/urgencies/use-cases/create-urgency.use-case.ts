import { Urgency } from "../domain/urgency.entity";
import type { IUrgencyRepository } from "../urgency.repository";
import { toUrgencyDTO, type UrgencyDTO } from "../urgency.dto";
import type { CreateUrgencyDTO } from "../schema";

export class CreateUrgencyUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(input: CreateUrgencyDTO): Promise<UrgencyDTO> {
    // Valida as invariantes de domínio (ex.: valorArrecadado <= metaArrecadacao)
    // centralizadas na fábrica Urgency.create().
    Urgency.create(input);

    const urgency = await this.repository.create(input);
    return toUrgencyDTO(urgency);
  }
}
