import type { IUrgencyRepository } from "../urgency.repository";
import { toUrgencyDTO, type UrgencyDTO } from "../urgency.dto";

export class ListUrgenciesUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(): Promise<UrgencyDTO[]> {
    const urgencies = await this.repository.list();
    return urgencies.map(toUrgencyDTO);
  }
}
