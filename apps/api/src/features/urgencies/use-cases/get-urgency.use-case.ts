import type { IUrgencyRepository } from "../urgency.repository";
import { toUrgencyDTO, type UrgencyDTO } from "../urgency.dto";

export class GetUrgencyUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(id: string): Promise<UrgencyDTO> {
    const urgency = await this.repository.findById(id);
    return toUrgencyDTO(urgency);
  }
}
