import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { animalService } from "../services/animal-service";
import type { NovoAnimalInput } from "../types";

const ANIMAIS_QUERY_KEY = ["animais"];

export function useAnimais() {
  return useQuery({
    queryKey: ANIMAIS_QUERY_KEY,
    queryFn: animalService.list,
  });
}

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
