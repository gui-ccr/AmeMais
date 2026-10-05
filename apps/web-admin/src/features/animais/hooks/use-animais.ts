import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { animalService } from "../services/animal-service";
import type { AlterarStatusInput, NovoAnimalInput } from "../types";

const ANIMAIS_QUERY_KEY = ["animais"];

/** Lista os animais (`GET /api/animals`). */
export function useAnimais() {
  return useQuery({
    queryKey: ANIMAIS_QUERY_KEY,
    queryFn: animalService.list,
  });
}

/** Cadastra um animal (`POST /api/animals`). */
export function useCreateAnimal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NovoAnimalInput) => animalService.create(input),
    onSuccess: () => {
      // Recarrega a lista: o novo animal aparece sem o usuário atualizar a página.
      queryClient.invalidateQueries({ queryKey: ANIMAIS_QUERY_KEY });
    },
  });
}

/** Troca o status de um animal (`PATCH /api/animals/:id` — a API não tem `PUT`). */
export function useUpdateAnimalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AlterarStatusInput }) => animalService.updateStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANIMAIS_QUERY_KEY });
    },
  });
}

/** Exclui um animal (`DELETE /api/animals/:id`). */
export function useDeleteAnimal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => animalService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANIMAIS_QUERY_KEY });
    },
  });
}
