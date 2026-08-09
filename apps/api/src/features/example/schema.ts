import { z } from "zod";

export const createExampleSchema = z.object({
  name: z.string().min(1, "name é obrigatório"),
});

export type CreateExampleInput = z.infer<typeof createExampleSchema>;
