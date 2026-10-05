import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doacaoService } from "../services/doacao-service";
import type { EditarDoacaoInput, NovaDoacaoInput } from "../types";

const DOACOES_QUERY_KEY = ["doacoes"];

export function useDoacoes() {
  return useQuery({
    queryKey: DOACOES_QUERY_KEY,
    queryFn: doacaoService.list,
  });
}

export function useCreateDoacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovaDoacaoInput) => doacaoService.create(input),
    onSuccess: () => {
      // Recarrega a lista: a doação nova aparece sem o usuário atualizar a página.
      queryClient.invalidateQueries({ queryKey: DOACOES_QUERY_KEY });
    },
  });
}

export function useUpdateDoacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditarDoacaoInput }) => doacaoService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOACOES_QUERY_KEY });
    },
  });
}
