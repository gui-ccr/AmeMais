import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { larService } from "../services/lar-service";
import type { EditarLarInput, NovoLarInput, StatusLar } from "../types";

/**
 * Chave de todas as consultas de lares. A lista usa exatamente esta chave e cada lar
 * individual usa `[...LARES_QUERY_KEY, id]`; por isso invalidar `LARES_QUERY_KEY`
 * atualiza a lista E os detalhes abertos de uma vez.
 */
export const LARES_QUERY_KEY = ["lares"] as const;

/** Lista os lares (`GET /api/lares`). */
export function useLares() {
  return useQuery({
    queryKey: LARES_QUERY_KEY,
    queryFn: larService.list,
  });
}

/** Busca um lar (`GET /api/lares/:id`). Sem `id`, não busca nada. */
export function useLar(id: string | null | undefined) {
  return useQuery({
    queryKey: [...LARES_QUERY_KEY, id],
    queryFn: () => larService.get(id!),
    enabled: !!id,
  });
}

/** Cadastra um lar (`POST /api/lares`). Depois de criar, a lista é recarregada sozinha. */
export function useCreateLar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovoLarInput) => larService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LARES_QUERY_KEY });
    },
  });
}

/** Edita os dados de um lar (ver o aviso em `larService.update`: a rota ainda depende do back). */
export function useUpdateLar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditarLarInput }) => larService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LARES_QUERY_KEY });
    },
  });
}

/** Troca o status de um lar (`PATCH /api/lares/:id`). Depois de trocar, a lista é recarregada sozinha. */
export function useUpdateLarStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusLar }) => larService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LARES_QUERY_KEY });
    },
  });
}
