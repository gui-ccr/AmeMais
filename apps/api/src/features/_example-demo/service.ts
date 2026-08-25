import type { ExampleItem } from "@amemais/shared-types";
import { exampleRepository } from "./repository";
import type { CreateExampleInput } from "./schema";

/**
 * Código de demonstração — feature de exemplo, remover quando as
 * features reais do produto existirem. Ilustra a camada de regra de
 * negócio (hoje é um passthrough, mas é aqui que entram validações
 * extras, orquestração entre repositórios, etc.).
 */
export const exampleService = {
  listExamples(): Promise<ExampleItem[]> {
    return exampleRepository.list();
  },

  createExample(input: CreateExampleInput): Promise<ExampleItem> {
    return exampleRepository.create(input);
  },
};
