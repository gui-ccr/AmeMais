import { ok, fail } from "@/core/http";
import { createSupabaseAnon } from "@/lib/supabase";
import { PublicUrgencyRepository } from "./public-urgency.repository";
import { ListPublicUrgenciesUseCase } from "./use-cases/list-public-urgencies.use-case";

/**
 * Sem cache de CDN/navegador de propósito: quem guarda cache é o site
 * (`apps/web-public`, com revalidação sob demanda — ADR 0009). Um cache a mais
 * aqui faria o site, ao limpar o dele, receber a resposta velha de volta.
 */
function noStore<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/**
 * Rotas PÚBLICAS: sem login, só leitura, sempre com o client anônimo. Não
 * chamam `requireUser` nem `createSupabaseForUser` de propósito.
 */
export class PublicController {
  listUrgencies = async () => {
    try {
      const useCase = new ListPublicUrgenciesUseCase(new PublicUrgencyRepository(createSupabaseAnon()));
      return noStore(ok(await useCase.execute()));
    } catch (error) {
      return noStore(fail(error));
    }
  };
}

export const publicController = new PublicController();
