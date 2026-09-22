import { urgencyController } from "./controller";

/**
 * Tabela de endpoints da feature: 1 entrada = 1 verbo HTTP + 1 método do
 * controller.
 *
 * Cada objeto corresponde a um segmento de URL físico, porque o Next.js só
 * reconhece rotas dentro de `app/`, uma pasta por segmento:
 *  - urgencyCollectionRoutes -> apps/api/app/api/urgencias/route.ts              (/api/urgencias)
 *  - urgencyItemRoutes       -> apps/api/app/api/urgencias/[id]/route.ts         (/api/urgencias/:id)
 *  - urgencyDonationRoutes   -> apps/api/app/api/urgencias/[id]/doacao/route.ts  (/api/urgencias/:id/doacao)
 *
 * Esses arquivos em app/ não têm lógica nenhuma — só reexportam o que está
 * declarado aqui, porque o Next.js exige o arquivo físico ali pra registrar
 * a rota.
 */
export const urgencyCollectionRoutes = {
  GET: urgencyController.list,
  POST: urgencyController.create,
};

export const urgencyItemRoutes = {
  GET: urgencyController.getById,
  PATCH: urgencyController.update,
  DELETE: urgencyController.delete,
};

export const urgencyDonationRoutes = {
  POST: urgencyController.registerDonation,
};