import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard-service";

export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

/** Números da home. Recarrega ao voltar para a aba, que é quando alguém já mexeu em outra tela. */
export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: dashboardService.get,
    staleTime: 30_000,
  });
}
