import { publicController } from "./controller";

/**
 * Rotas públicas (sem login) consumidas pelo site público. Contrato em
 * `packages/shared-types/src/public`. Ver ADR 0009.
 *
 *  - publicUrgencyRoutes -> apps/api/app/api/public/urgencias/route.ts (/api/public/urgencias)
 */
export const publicUrgencyRoutes = {
  GET: publicController.listUrgencies,
};
