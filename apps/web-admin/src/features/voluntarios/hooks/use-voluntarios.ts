import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { voluntarioService } from "../services/voluntario-service";
import type { EditarVoluntarioInput, NovoVoluntarioInput, StatusVoluntario, Voluntario, VoluntarioDetalhe } from "../types";

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

/** Busca um voluntário, com o lar temporário dele. Sem `id`, não busca nada. */
export function useVoluntario(id: string | null | undefined) {
  return useQuery({
    queryKey: [...VOLUNTARIOS_QUERY_KEY, id],
    queryFn: () => voluntarioService.get(id!),
    enabled: !!id,
  });
}

/**
 * Grava na lista em cache o voluntário que a API devolveu (a API não devolve o lar: o
 * `larTemporario` de cada item é mantido). Assim a lista e o modal mudam na hora, sem esperar a recarga.
 */
function atualizarNaLista(queryClient: ReturnType<typeof useQueryClient>, voluntario: Voluntario) {
  queryClient.setQueryData<VoluntarioDetalhe[]>(VOLUNTARIOS_QUERY_KEY, (lista) =>
    lista?.map((item) => (item.id === voluntario.id ? { ...item, ...voluntario } : item)),
  );
}

/** Cadastra um voluntário. Depois de criar, a lista é recarregada sozinha. */
export function useCreateVoluntario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovoVoluntarioInput) => voluntarioService.create(input),
    onSuccess: () => {
      // `exact`: só a lista. Um cadastro novo não muda os detalhes já abertos dos outros voluntários.
      queryClient.invalidateQueries({ queryKey: VOLUNTARIOS_QUERY_KEY, exact: true });
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
      // O PUT devolve o voluntário sem o lar: mescla com o detalhe em cache para não perder o
      // `larTemporario`. Sem detalhe em cache não grava nada (ele é buscado quando for usado).
      queryClient.setQueryData<VoluntarioDetalhe>([...VOLUNTARIOS_QUERY_KEY, id], (atual) =>
        atual ? { ...atual, ...voluntario } : undefined,
      );
      atualizarNaLista(queryClient, voluntario);
      // `exact`: só a lista; o detalhe já está certo e invalidá-lo faria buscar de novo.
      queryClient.invalidateQueries({ queryKey: VOLUNTARIOS_QUERY_KEY, exact: true });
    },
  });
}

/** Ativa/inativa um voluntário. A lista e o detalhe mudam na hora; depois a lista é recarregada. */
export function useUpdateVoluntarioStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusVoluntario }) => voluntarioService.updateStatus(id, status),
    onSuccess: (voluntario, { id }) => {
      queryClient.setQueryData<VoluntarioDetalhe>([...VOLUNTARIOS_QUERY_KEY, id], (atual) =>
        atual ? { ...atual, ...voluntario } : undefined,
      );
      atualizarNaLista(queryClient, voluntario);
      queryClient.invalidateQueries({ queryKey: VOLUNTARIOS_QUERY_KEY, exact: true });
    },
  });
}

/** Remove um voluntário (a API recusa com 409 se ele tem lar vinculado). Ele some da lista na hora. */
export function useRemoveVoluntario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => voluntarioService.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<VoluntarioDetalhe[]>(VOLUNTARIOS_QUERY_KEY, (lista) =>
        lista?.filter((item) => item.id !== id),
      );
      queryClient.removeQueries({ queryKey: [...VOLUNTARIOS_QUERY_KEY, id], exact: true });
      queryClient.invalidateQueries({ queryKey: VOLUNTARIOS_QUERY_KEY, exact: true });
    },
  });
}
