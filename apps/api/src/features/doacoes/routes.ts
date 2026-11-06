import { doacaoController } from "./controller";

/**
 * Tabela de endpoints da feature (os arquivos em app/ só reexportam daqui):
 *  - doacaoCollectionRoutes -> apps/api/app/api/doacoes/route.ts       (/api/doacoes)
 *  - doacaoItemRoutes       -> apps/api/app/api/doacoes/[id]/route.ts  (/api/doacoes/:id)
 *
 * PUT e PATCH apontam para a mesma edição (parcial: só os campos enviados mudam).
 */
export const doacaoCollectionRoutes = {
  GET: doacaoController.list,
  POST: doacaoController.create,
};

export const doacaoItemRoutes = {
  GET: doacaoController.getById,
  PUT: doacaoController.update,
  PATCH: doacaoController.update,
  DELETE: doacaoController.delete,
};
