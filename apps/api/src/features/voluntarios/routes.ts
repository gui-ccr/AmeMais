import { voluntarioController } from "./controller";


export const voluntarioCollectionRoutes = {
  GET: voluntarioController.list,
  POST: voluntarioController.create,
};

/** apps/api/app/api/voluntarios/[id]/route.ts -> /api/voluntarios/:id */
export const voluntarioItemRoutes = {
  GET: voluntarioController.getById,
  PUT: voluntarioController.update,
  DELETE: voluntarioController.delete,
};

/** apps/api/app/api/voluntarios/[id]/status/route.ts -> /api/voluntarios/:id/status */
export const voluntarioStatusRoutes = {
  PATCH: voluntarioController.updateStatus,
};
