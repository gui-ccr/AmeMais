import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exampleService } from "../services/example-service";

const EXAMPLES_QUERY_KEY = ["examples"];

export function useExamples() {
  return useQuery({
    queryKey: EXAMPLES_QUERY_KEY,
    queryFn: exampleService.list,
  });
}

export function useCreateExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exampleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMPLES_QUERY_KEY });
    },
  });
}
