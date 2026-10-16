import { voluntarioController } from "./controller";


export const voluntarioCollectionRoutes = {
  GET: voluntarioController.list,
  POST: voluntarioController.create,
};

/** apps/api/app/api/voluntarios/[id]/route.ts -> /api/voluntarios/:id */
export const voluntarioItemRoutes = {
  GET: voluntarioController.getById,
  PUT: voluntarioController.update,
};
