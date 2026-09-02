import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventoService } from "../services/evento-service";
import type { EventoFormValues } from "../types";

const EVENTOS_QUERY_KEY = ["eventos"];

export function useEvents() {
  return useQuery({
    queryKey: EVENTOS_QUERY_KEY,
    queryFn: eventoService.list,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EventoFormValues) => eventoService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTOS_QUERY_KEY });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EventoFormValues }) =>
      eventoService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTOS_QUERY_KEY });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventoService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTOS_QUERY_KEY });
    },
  });
}
