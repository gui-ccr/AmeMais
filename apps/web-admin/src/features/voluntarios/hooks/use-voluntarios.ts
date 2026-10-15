import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { voluntarioService } from "../services/voluntario-service";
import type { EditarVoluntarioInput, NovoVoluntarioInput } from "../types";

/**
 * Chave de todas as consultas de voluntários. A lista usa exatamente esta chave e cada
 * voluntário usa `[...VOLUNTARIOS_QUERY_KEY, id]`; por isso invalidar `VOLUNTARIOS_QUERY_KEY`
 * atualiza a lista E os detalhes abertos de uma vez.
 */
export const VOLUNTARIOS_QUERY_KEY = ["voluntarios"] as const;

/** Lista os voluntários. */
export function useVoluntarios() {
  return useQuery({
    queryKey: VOLUNTARIOS_QUERY_KEY,
    queryFn: voluntarioService.list,
  });
}

/** Busca um voluntário. Sem `id`, não busca nada. */
export function useVoluntario(id: string | null | undefined) {
  return useQuery({
    queryKey: [...VOLUNTARIOS_QUERY_KEY, id],
    queryFn: () => voluntarioService.get(id!),
    enabled: !!id,
  });
}

/** Cadastra um voluntário. Depois de criar, a lista é recarregada sozinha. */
export function useCreateVoluntario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovoVoluntarioInput) => voluntarioService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOLUNTARIOS_QUERY_KEY });
    },
  });
}

/** Edita um voluntário. Depois de salvar, a lista e o detalhe são recarregados sozinhos. */
export function useUpdateVoluntario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditarVoluntarioInput }) => voluntarioService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOLUNTARIOS_QUERY_KEY });
    },
  });
}
