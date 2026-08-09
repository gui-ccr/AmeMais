import type { ExampleItem } from "@amemais/shared-types";
import { exampleRepository } from "./repository";
import type { CreateExampleInput } from "./schema";

/**
 * Camada de regra de negócio. Hoje é um passthrough, mas é aqui que
 * entram validações extras, orquestração entre repositórios, etc.
 */
export const exampleService = {
  listExamples(): Promise<ExampleItem[]> {
    return exampleRepository.list();
  },

  createExample(input: CreateExampleInput): Promise<ExampleItem> {
    return exampleRepository.create(input);
  },
};
