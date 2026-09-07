import { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError, ValidationError } from "@/core/errors";
import { podeAlterarStatus, type AnimalStatus } from "./domain/animal";
import { animalRepository, type AnimalRepositoryFilters } from "./repository";
import type { AnimalItem, CreateAnimalInput, UpdateAnimalInput } from "./schema";

function normalizeStatusToDomain(statusStr: string): AnimalStatus | null {
  const s = statusStr
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  if (s === "disponivel") return "disponivel";
  if (s === "em_tratamento" || s === "tratamento") return "em_tratamento";
  if (s === "em_lar_temporario" || s === "lar_temporario" || s === "temporario") return "em_lar_temporario";
  if (s === "adotado") return "adotado";

  return null;
}

/**
 * Camada de serviço de Animais (Regras de Negócio).
 * Isolada de detalhes HTTP.
 */
export const animalService = {
  async listAnimals(filters?: AnimalRepositoryFilters, client?: SupabaseClient): Promise<AnimalItem[]> {
    return animalRepository.list(filters, client);
  },

  async getAnimalById(id: string, client?: SupabaseClient): Promise<AnimalItem> {
    if (!id || !id.trim()) {
      throw new ValidationError("ID do animal é obrigatório");
    }

    const animal = await animalRepository.getById(id, client);
    if (!animal) {
      throw new NotFoundError("Animal");
    }

    return animal;
  },

  async createAnimal(input: CreateAnimalInput, client?: SupabaseClient): Promise<AnimalItem> {
    return animalRepository.create(input, client);
  },

  async updateAnimal(id: string, input: UpdateAnimalInput, client?: SupabaseClient): Promise<AnimalItem> {
    if (!id || !id.trim()) {
      throw new ValidationError("ID do animal é obrigatório");
    }

    const existing = await animalRepository.getById(id, client);
    if (!existing) {
      throw new NotFoundError("Animal");
    }

    // Validação da máquina de estados do domínio de animais caso o status seja alterado
    if (input.status_adocao && input.status_adocao !== existing.status_adocao) {
      const currentDomainStatus = normalizeStatusToDomain(existing.status_adocao);
      const newDomainStatus = normalizeStatusToDomain(input.status_adocao);

      if (currentDomainStatus && newDomainStatus && currentDomainStatus !== newDomainStatus) {
        const permitido = podeAlterarStatus(currentDomainStatus, newDomainStatus);
        if (!permitido) {
          throw new ValidationError(
            `Transição de status inválida: não é permitido alterar de '${existing.status_adocao}' para '${input.status_adocao}'`
          );
        }
      }
    }

    const updated = await animalRepository.update(id, input, client);
    if (!updated) {
      throw new NotFoundError("Animal");
    }

    return updated;
  },

  async deleteAnimal(id: string, client?: SupabaseClient): Promise<void> {
    if (!id || !id.trim()) {
      throw new ValidationError("ID do animal é obrigatório");
    }

    const existing = await animalRepository.getById(id, client);
    if (!existing) {
      throw new NotFoundError("Animal");
    }

    await animalRepository.remove(id, client);
  },
};

