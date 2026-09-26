import { shelterController } from "./controller";

/**
 * Tabela de endpoints da feature: 1 entrada = 1 verbo HTTP + 1 método do controller.
 *
 * Cada objeto corresponde a um segmento de URL físico no Next.js App Router:
 *  - shelterCollectionRoutes -> apps/api/app/api/lares/route.ts       (/api/lares)
 *  - shelterItemRoutes       -> apps/api/app/api/lares/[id]/route.ts  (/api/lares/:id)
 */
export const shelterCollectionRoutes = {
  GET: shelterController.list,
  POST: shelterController.create,
};

export const shelterItemRoutes = {
  GET: shelterController.getById,
  PATCH: shelterController.updateStatus,
  DELETE: shelterController.delete,
};

