import { BusinessRuleError } from "@/core/errors";
import type { IShelterRepository } from "../shelter.repository";

/**
 * "Remover" um lar não apaga a linha (KAN-80): ele é inativado, para não
 * perder o cadastro nem o histórico dos animais que passaram por ele.
 * Lar com animais não pode ser removido: primeiro é preciso tirar os animais.
 */
export class DeleteShelterUseCase {
  constructor(private readonly repository: IShelterRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.findById(id);

    const ocupacao = await this.repository.contarAnimais(id);
    if (ocupacao > 0) {
      throw new BusinessRuleError(
        `Não é possível remover um lar com ${ocupacao} animal(is). Tire os animais do lar antes.`,
      );
    }

    await this.repository.inativar(id);
  }
}
