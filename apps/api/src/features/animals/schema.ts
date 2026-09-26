import { z } from "zod";
import { ESPECIES } from "./domain/animal-options";
import { ANIMAL_STATUSES } from "./domain/animal-status.vo";

/**
 * Schemas Zod: validam o que chega pela requisição. Os tipos inferidos
 * daqui são os DTOs de entrada usados pelo controller e repassados,
 * já validados, para o use case.
 */
/**
 * As mesmas faixas do Value Object `Adotante` (a fonte de verdade), conferidas
 * já na borda HTTP para devolver 400 com `issues` campo a campo, em vez de só
 * a mensagem genérica do domínio. O CEP entra só com os 8 dígitos (a máscara é
 * coisa da tela).
 */
const adotanteSchema = z.object({
  nome: z.string().min(2, "nome do adotante deve ter pelo menos 2 caracteres"),
  idade: z
    .number()
    .int("idade do adotante deve ser um número inteiro")
    .min(1, "idade do adotante deve ser no mínimo 1")
    .max(120, "idade do adotante deve ser no máximo 120"),
  cep: z.string().regex(/^\d{8}$/, "cep do adotante deve conter exatamente 8 números"),
  localidade: z.string().min(1, "localidade do adotante é obrigatória"),
});

const dataAdocaoSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dataAdocao deve estar no formato AAAA-MM-DD");

export const createAnimalSchema = z.object({
  nome: z.string().min(2, "nome deve ter pelo menos 2 caracteres"),
  especie: z.enum(ESPECIES).optional(),
  raca: z.string().optional(),
  status: z.enum(ANIMAL_STATUSES).default("disponivel"),
  urlFoto: z.string().url().optional(),
  adotante: adotanteSchema.optional(),
  dataAdocao: dataAdocaoSchema.optional(),
});
export type CreateAnimalDTO = z.infer<typeof createAnimalSchema>;

/**
 * Para `status: "adotado"`, `adotante` e `dataAdocao` são obrigatórios — a regra
 * mora em `Animal.changeStatus`; aqui só o formato. Para os demais status não
 * devem ser enviados.
 */
export const updateAnimalStatusSchema = z.object({
  status: z.enum(ANIMAL_STATUSES),
  adotante: adotanteSchema.optional(),
  dataAdocao: dataAdocaoSchema.optional(),
});
export type UpdateAnimalStatusDTO = z.infer<typeof updateAnimalStatusSchema>;

export const animalIdParamSchema = z.object({
  id: z.string().uuid("id inválido"),
});
