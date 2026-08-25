import type { ExampleItem } from "@amemais/shared-types";
import { api } from "@/lib/axios";

/**
 * Código de demonstração — só ilustra o consumo do apps/api.
 * Remover quando as features reais do produto existirem.
 */
export const exampleService = {
  async list(): Promise<ExampleItem[]> {
    const { data } = await api.get<{ data: ExampleItem[] }>("/api/example-demo");
    return data.data;
  },

  async create(name: string): Promise<ExampleItem> {
    const { data } = await api.post<{ data: ExampleItem }>("/api/example-demo", { name });
    return data.data;
  },
};
