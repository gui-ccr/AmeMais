import { publicController } from "./controller";

/**
 * Rotas públicas (sem login) consumidas pelo site público. Contrato em
 * `packages/shared-types/src/public`. Ver ADR 0009.
 *
 *  - publicUrgencyRoutes         -> apps/api/app/api/public/urgencias/route.ts      (/api/public/urgencias)
 *  - publicAnimalRoutes          -> apps/api/app/api/public/animais/route.ts        (/api/public/animais)
 *  - publicCollectionPointRoutes -> apps/api/app/api/public/pontos-coleta/route.ts  (/api/public/pontos-coleta)
 */
export const publicUrgencyRoutes = {
  GET: publicController.listUrgencies,
};

export const publicAnimalRoutes = {
  GET: publicController.listAnimals,
};

export const publicCollectionPointRoutes = {
  GET: publicController.listCollectionPoints,
};
