"use client";

import { isAxiosError } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/** Erros que repetir não resolve (sem sessão, sem permissão, não existe): falham na hora. */
const STATUS_SEM_RETRY = [401, 403, 404];

export function deveTentarNovamente(falhas: number, erro: unknown): boolean {
  const status = isAxiosError(erro) ? erro.response?.status : undefined;
  if (status && STATUS_SEM_RETRY.includes(status)) return false;
  return falhas < 3;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // staleTime evita refetch quando vários componentes montam a mesma query (ex.: perfil na sidebar e na página).
          queries: { retry: deveTentarNovamente, staleTime: 60_000 },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
