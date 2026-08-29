import { z } from "zod";

// Definição de tipos primitivos comuns
export const animalStatusSchema = z.enum(["Disponível", "Adotado", "Em Tratamento", "Temporário"]);
export type AnimalStatus = z.infer<typeof animalStatusSchema>;

// Esquema de validação para criação de um animal
export const createAnimalSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  idade: z.number().int().nonnegative("A idade não pode ser negativa"),
  tipo: z.enum(["Cachorro", "Gato", "Outro"]),
  status: animalStatusSchema.default("Disponível"),
  descricao: z.string().max(500, "A descrição não pode passar de 500 caracteres").optional(),
});

export type CreateAnimalInput = z.infer<typeof createAnimalSchema>;

// Esquema de validação para atualização (campos opcionais)
export const updateAnimalSchema = createAnimalSchema.partial();

export type UpdateAnimalInput = z.infer<typeof updateAnimalSchema>;

// Esquema de retorno do backend
export const animalResponseSchema = createAnimalSchema.extend({
  id: z.string().uuid(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime().optional(),
});

export type AnimalResponse = z.infer<typeof animalResponseSchema>;

// Matriz de transições de status permitidas
export const VALID_STATUS_TRANSITIONS: Record<AnimalStatus, AnimalStatus[]> = {
  "Disponível": ["Adotado", "Em Tratamento", "Temporário"],
  "Em Tratamento": ["Disponível", "Temporário"], // Não pode ir direto para "Adotado"
  "Temporário": ["Disponível", "Adotado", "Em Tratamento"],
  "Adotado": ["Disponível"], // Se devolvido, volta para "Disponível"
};

/**
 * Verifica se a transição entre o status atual de um animal e o próximo status é permitida.
 * Utilizado no frontend para restringir a interface e no backend para validar requisições de update.
 */
export function isValidStatusTransition(current: AnimalStatus, next: AnimalStatus): boolean {
  if (current === next) return true;
  const allowedTransitions = VALID_STATUS_TRANSITIONS[current];
  return allowedTransitions.includes(next);
}

