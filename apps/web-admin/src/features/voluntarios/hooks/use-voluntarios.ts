import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { voluntarioService } from "../services/voluntario-service";
import type { EditarVoluntarioInput, NovoVoluntarioInput } from "../types";

/**
 * Chave de todas as consultas de voluntários. A lista usa exatamente esta chave e cada
 * voluntário usa `[...VOLUNTARIOS_QUERY_KEY, id]`; invalidar `VOLUNTARIOS_QUERY_KEY` sem
 * `exact` atualiza a lista E os detalhes abertos de uma vez.
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

/**
 * Edita um voluntário. O detalhe recebe na hora o voluntário que a API devolveu (não
 * pisca nem busca de novo) e a lista é recarregada sozinha.
 */
export function useUpdateVoluntario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditarVoluntarioInput }) => voluntarioService.update(id, input),
    onSuccess: (voluntario, { id }) => {
      queryClient.setQueryData([...VOLUNTARIOS_QUERY_KEY, id], voluntario);
      // `exact`: só a lista; o detalhe já está certo e invalidá-lo faria buscar de novo.
      queryClient.invalidateQueries({ queryKey: VOLUNTARIOS_QUERY_KEY, exact: true });
    },
  });
}
