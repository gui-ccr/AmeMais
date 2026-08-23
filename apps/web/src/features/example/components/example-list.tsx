"use client";

import { Button } from "@/components/ui/button";
import { useCreateExample, useExamples } from "../hooks/use-examples";

export function ExampleList() {
  const { data: examples, isLoading, isError, } = useExamples();
  const createExample = useCreateExample();

  if (isLoading) return <p>Carregando...</p>;
  if (isError) return <p>Erro ao carregar exemplos (verifique se o apps/api está rodando).</p>;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1">
        {examples?.map((example) => (
          <li key={example.id}>{example.name}</li>
        ))}
      </ul>
      <Button
        onClick={() => createExample.mutate(`Exemplo ${Date.now()}`)}
        disabled={createExample.isPending}
      >
        Criar exemplo
      </Button>
    </div>
  );
}
