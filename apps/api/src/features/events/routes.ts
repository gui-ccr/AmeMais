import { eventController } from "./controller";

/**
 * Tabela de endpoints da feature: 1 entrada = 1 verbo HTTP + 1 método do
 * controller.
 *
 * Cada objeto corresponde a um segmento de URL físico, porque o Next.js só
 * reconhece rotas dentro de `app/`, uma pasta por segmento:
 *  - eventCollectionRoutes -> apps/api/app/api/events/route.ts       (/api/events)
 *  - eventItemRoutes       -> apps/api/app/api/events/[id]/route.ts  (/api/events/:id)
 *
 * Esses dois arquivos em app/ não têm lógica nenhuma — só reexportam o que
 * está declarado aqui, porque o Next.js exige o arquivo físico ali pra
 * registrar a rota.
 */
export const eventCollectionRoutes = {
  GET: eventController.list,
  POST: eventController.create,
};

export const eventItemRoutes = {
  GET: eventController.getById,
  PATCH: eventController.update,
  DELETE: eventController.delete,
};
