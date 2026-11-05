import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { equipeService } from "../services/equipe-service";
import type { DepartamentoInput, NovoMembroInput, Permissao } from "../types";

export const MEMBROS_QUERY_KEY = ["equipe", "membros"] as const;
export const DEPARTAMENTOS_QUERY_KEY = ["equipe", "departamentos"] as const;

/** Membros que batem com a busca (a busca é feita no servidor). */
export function useMembros(busca: string) {
  return useQuery({
    queryKey: [...MEMBROS_QUERY_KEY, busca.trim()],
    queryFn: () => equipeService.listMembros(busca),
    retry: false,
  });
}

export function useDepartamentosEModulos() {
  return useQuery({
    queryKey: DEPARTAMENTOS_QUERY_KEY,
    queryFn: equipeService.listDepartamentos,
    retry: false,
  });
}

/** Mexer em departamentos de membros muda a contagem de membros dos departamentos e vice-versa. */
function useInvalidarEquipe() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["equipe"] });
}

export function useCreateMembro() {
  const invalidar = useInvalidarEquipe();
  return useMutation({ mutationFn: (input: NovoMembroInput) => equipeService.createMembro(input), onSuccess: invalidar });
}

export function useUpdateDepartamentosDoMembro() {
  const invalidar = useInvalidarEquipe();
  return useMutation({
    mutationFn: ({ id, departamentoIds }: { id: string; departamentoIds: string[] }) =>
      equipeService.updateDepartamentosDoMembro(id, departamentoIds),
    onSuccess: invalidar,
  });
}

export function useUpdateAtivo() {
  const invalidar = useInvalidarEquipe();
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => equipeService.updateAtivo(id, ativo),
    onSuccess: invalidar,
  });
}

export function useGerarSenhaProvisoria() {
  return useMutation({ mutationFn: (id: string) => equipeService.gerarSenhaProvisoria(id) });
}

export function useCreateDepartamento() {
  const invalidar = useInvalidarEquipe();
  return useMutation({ mutationFn: (input: DepartamentoInput) => equipeService.createDepartamento(input), onSuccess: invalidar });
}

export function useUpdateDepartamento() {
  const invalidar = useInvalidarEquipe();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DepartamentoInput }) => equipeService.updateDepartamento(id, input),
    onSuccess: invalidar,
  });
}

export function useSalvarMatriz() {
  const invalidar = useInvalidarEquipe();
  return useMutation({
    mutationFn: ({ id, permissoes }: { id: string; permissoes: Permissao[] }) => equipeService.salvarMatriz(id, permissoes),
    onSuccess: invalidar,
  });
}

export function useRemoveDepartamento() {
  const invalidar = useInvalidarEquipe();
  return useMutation({ mutationFn: (id: string) => equipeService.removeDepartamento(id), onSuccess: invalidar });
}
