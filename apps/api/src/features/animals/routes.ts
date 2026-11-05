import { animalController } from "./controller";

/**
 * Tabela de endpoints da feature: 1 entrada = 1 verbo HTTP + 1 método do
 * controller — como um arquivo de rotas de um framework com router próprio
 * (`router.get("/", controller.listar)`), só que aqui as chaves já são os
 * nomes que o Next.js App Router espera exportar (`GET`, `POST`, ...).
 *
 * Cada objeto corresponde a um segmento de URL físico, porque o Next.js só
 * reconhece rotas dentro de `app/`, uma pasta por segmento:
 *  - animalCollectionRoutes -> apps/api/app/api/animals/route.ts       (/api/animals)
 *  - animalItemRoutes       -> apps/api/app/api/animals/[id]/route.ts  (/api/animals/:id)
 *
 * Esses dois arquivos em app/ não têm lógica nenhuma — só reexportam o que
 * está declarado aqui, porque o Next.js exige o arquivo físico ali pra
 * registrar a rota.
 */
export const animalCollectionRoutes = {
  GET: animalController.list,
  POST: animalController.create,
};

export const animalItemRoutes = {
  GET: animalController.getById,
  PUT: animalController.update,
  PATCH: animalController.updateStatus,
  DELETE: animalController.delete,
};
