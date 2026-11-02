import { api } from "@/lib/axios";
import type { Dashboard } from "../types";

export const dashboardService = {
  /** Os números da home. A API já devolve só os blocos dos módulos que a pessoa pode acessar. */
  async get(): Promise<Dashboard> {
    const { data } = await api.get<{ data: Dashboard }>("/api/dashboard");
    return data.data;
  },
};
