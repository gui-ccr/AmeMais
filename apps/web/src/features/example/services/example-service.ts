import type { ExampleItem } from "@amemais/shared-types";
import { api } from "@/lib/axios";

export const exampleService = {
  async list(): Promise<ExampleItem[]> {
    const { data } = await api.get<{ data: ExampleItem[] }>("/api/example");
    return data.data;
  },

  async create(name: string): Promise<ExampleItem> {
    const { data } = await api.post<{ data: ExampleItem }>("/api/example", { name });
    return data.data;
  },
};
