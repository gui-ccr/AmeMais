import type { IUrgencyRepository } from "../urgency.repository";
import { toUrgencyDTO, type UrgencyDTO } from "../urgency.dto";
import type { UpdateUrgencyDTO } from "../schema";

/**
 * Busca a entidade, pede para ela mesma validar e aplicar as mudanças
 * (`Urgency.update`, que lança `ValidationError` se algum campo ficar inválido)
 * e só então persiste via repository — o use case apenas orquestra o fluxo.
 */
export class UpdateUrgencyUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(id: string, input: UpdateUrgencyDTO): Promise<UrgencyDTO> {
    const urgency = await this.repository.findById(id);
    urgency.update(input);

    // Persiste os valores já normalizados pela entidade (ex.: titulo/descricao
    // trimados), não o input crú — a entidade é a única fonte de verdade do
    // que é válido, então é ela quem decide o que efetivamente é gravado.
    const patch: UpdateUrgencyDTO = { ...input };
    if (input.titulo !== undefined) patch.titulo = urgency.titulo;
    if (input.descricao !== undefined) patch.descricao = urgency.descricao;

    const updated = await this.repository.update(id, patch);
    return toUrgencyDTO(updated);
  }
}
