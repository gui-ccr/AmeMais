import type { IUrgencyRepository } from "../urgency.repository";
import { toUrgencyDTO, type UrgencyDTO } from "../urgency.dto";

export interface RegisterDonationInput {
  id: string;
  valor: number;
}

/**
 * Caso de uso: Registrar doação para uma urgência.
 *
 * Fluxo:
 * 1. Busca a urgência no repository pelo ID (lança NotFoundError se inexistente);
 * 2. Invoca a regra de negócio da entidade de domínio (`urgency.registrarArrecadacao(valor)`),
 *    que valida valor > 0 e que o novo total não ultrapasse a meta (<= meta é permitido,
 *    > meta lança ValidationError);
 * 3. Se a regra falhar, a operação é abortada e nada é persistido;
 * 4. Se for válida, persiste o novo valor no Supabase via repository;
 * 5. Retorna o DTO atualizado no formato da API.
 */
export class RegisterDonationUseCase {
  constructor(private readonly repository: IUrgencyRepository) {}

  async execute(id: string, valor: number): Promise<UrgencyDTO>;
  async execute(input: RegisterDonationInput): Promise<UrgencyDTO>;
  async execute(
    idOrInput: string | RegisterDonationInput,
    maybeValor?: number,
  ): Promise<UrgencyDTO> {
    const id = typeof idOrInput === "string" ? idOrInput : idOrInput.id;
    const valor = typeof idOrInput === "string" ? (maybeValor as number) : idOrInput.valor;

    const urgency = await this.repository.findById(id);

    // A regra de negócio mora na entidade Urgency, protegendo o domínio:
    urgency.registrarArrecadacao(valor);

    // Apenas persiste se a regra de domínio foi satisfeita:
    const updated = await this.repository.updateValorArrecadado(id, urgency.valorArrecadado);
    return toUrgencyDTO(updated);
  }
}
