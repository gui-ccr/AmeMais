import { ConflictError } from "@/core/errors";
import type { IVoluntarioRepository } from "../voluntario.repository";

/**
 * Remove o voluntário só se ele não tiver lar vinculado. A FK de `lares_temporarios.voluntario_id`
 * é ON DELETE SET NULL: sem esta checagem o banco apagaria o voluntário e deixaria o lar sem responsável.
 */
export class DeleteVoluntarioUseCase {
  constructor(private readonly repository: IVoluntarioRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.findById(id);

    const lar = await this.repository.findLarVinculado(id);
    if (lar) {
      throw new ConflictError(
        "Este voluntário tem um lar temporário vinculado e não pode ser removido. Inative o voluntário em vez de removê-lo.",
      );
    }

    await this.repository.remove(id);
  }
}
