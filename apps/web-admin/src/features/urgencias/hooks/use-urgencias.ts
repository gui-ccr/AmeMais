import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { urgenciaService } from "../services/urgencia-service";
import type { UrgenciaFormValues } from "../types";

const URGENCIAS_QUERY_KEY = ["urgencias"];

export function useUrgencias() {
  return useQuery({
    queryKey: URGENCIAS_QUERY_KEY,
    queryFn: urgenciaService.list,
  });
}

export function useCreateUrgencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UrgenciaFormValues) => urgenciaService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URGENCIAS_QUERY_KEY });
    },
  });
}

export function useUpdateUrgencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UrgenciaFormValues }) =>
      urgenciaService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URGENCIAS_QUERY_KEY });
    },
  });
}

export function useDeleteUrgencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => urgenciaService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URGENCIAS_QUERY_KEY });
    },
  });
}
