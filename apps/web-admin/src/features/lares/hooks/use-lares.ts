import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { larService } from "../services/lar-service";
import type { EditarLarInput, LarDetalhe, NovoLarInput, StatusLar } from "../types";

/**
 * Chave de todas as consultas de lares. A lista usa exatamente esta chave e cada lar
 * individual usa `[...LARES_QUERY_KEY, id]`; por isso invalidar `LARES_QUERY_KEY` atualiza
 * a lista E os detalhes abertos de uma vez.
 */
export const LARES_QUERY_KEY = ["lares"] as const;

/** Mesma chave de apps/web-admin/src/features/animais/hooks/use-animais.ts (a lista de animais). */
const ANIMAIS_QUERY_KEY = ["animais"] as const;
const ANIMAIS_ELEGIVEIS_QUERY_KEY = ["lares", "animais-elegiveis"] as const;

/** Lista os lares (`GET /api/lares`). */
export function useLares() {
  return useQuery({
    queryKey: LARES_QUERY_KEY,
    queryFn: larService.list,
  });
}

/** Busca um lar com os animais dele (`GET /api/lares/:id`). Sem `id`, não busca nada. */
export function useLar(id: string | null | undefined) {
  return useQuery({
    queryKey: [...LARES_QUERY_KEY, id],
    queryFn: () => larService.get(id!),
    enabled: !!id,
  });
}

/** Animais que podem ir para um lar. Só busca quando `ativo` (painel de vincular aberto). */
export function useAnimaisElegiveis(ativo: boolean) {
  return useQuery({
    queryKey: ANIMAIS_ELEGIVEIS_QUERY_KEY,
    queryFn: larService.listAnimaisElegiveis,
    enabled: ativo,
    // Sempre atualizada ao abrir o painel: outro usuário pode ter vinculado o animal.
    staleTime: 0,
  });
}

/** Só a lista (os detalhes já abertos recebem o dado novo pelo `setQueryData`). */
function atualizarLista(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: LARES_QUERY_KEY, exact: true });
}

/** Cadastra um lar (`POST /api/lares`). Depois de criar, a lista é recarregada sozinha. */
export function useCreateLar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovoLarInput) => larService.create(input),
    onSuccess: () => atualizarLista(queryClient),
  });
}

/** Edita os dados de um lar (`PUT /api/lares/:id`). O detalhe aberto e a lista são atualizados. */
export function useUpdateLar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EditarLarInput }) => larService.update(id, input),
    onSuccess: (lar, { id }) => {
      // O PUT devolve o lar sem animais/voluntário: mescla com o detalhe em cache para não perdê-los.
      // O nome do voluntário pode ter mudado: por isso o detalhe também é invalidado.
      queryClient.setQueryData<LarDetalhe>([...LARES_QUERY_KEY, id], (atual) =>
        atual ? { ...atual, ...lar } : undefined,
      );
      queryClient.invalidateQueries({ queryKey: LARES_QUERY_KEY });
    },
  });
}

/** Troca o status de um lar (`PATCH /api/lares/:id`). */
export function useUpdateLarStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusLar }) => larService.updateStatus(id, status),
    onSuccess: (lar, { id }) => {
      queryClient.setQueryData<LarDetalhe>([...LARES_QUERY_KEY, id], (atual) =>
        atual ? { ...atual, ...lar } : undefined,
      );
      atualizarLista(queryClient);
    },
  });
}

/** Depois de vincular/desvincular: o lar atualizado vira o detalhe na hora e lista e animais são recarregados. */
function aposMudarAnimais(queryClient: QueryClient, lar: LarDetalhe) {
  queryClient.setQueryData<LarDetalhe>([...LARES_QUERY_KEY, lar.id], lar);
  atualizarLista(queryClient);
  queryClient.invalidateQueries({ queryKey: ANIMAIS_ELEGIVEIS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ANIMAIS_QUERY_KEY });
}

/** Vincula um animal ao lar (`POST /api/lares/:id/animais`). */
export function useVincularAnimal(larId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (animalId: string) => larService.addAnimal(larId, animalId),
    onSuccess: (lar) => aposMudarAnimais(queryClient, lar),
  });
}

/** Remove um animal do lar (`DELETE /api/lares/:id/animais/:animalId`). */
export function useDesvincularAnimal(larId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (animalId: string) => larService.removeAnimal(larId, animalId),
    onSuccess: (lar) => aposMudarAnimais(queryClient, lar),
  });
}
