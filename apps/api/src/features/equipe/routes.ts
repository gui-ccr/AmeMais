import { equipeController } from "./controller";

/** apps/api/app/api/equipe/membros/route.ts -> /api/equipe/membros */
export const membroCollectionRoutes = {
  GET: equipeController.listMembros,
  POST: equipeController.createMembro,
};

/** .../membros/[id]/departamentos/route.ts */
export const membroDepartamentosRoutes = { PUT: equipeController.updateDepartamentosDoMembro };

/** .../membros/[id]/status/route.ts */
export const membroStatusRoutes = { PATCH: equipeController.updateStatusDoMembro };

/** .../membros/[id]/senha-provisoria/route.ts */
export const membroSenhaProvisoriaRoutes = { POST: equipeController.redefinirSenhaDoMembro };

/** apps/api/app/api/equipe/departamentos/route.ts */
export const departamentoCollectionRoutes = {
  GET: equipeController.listDepartamentos,
  POST: equipeController.createDepartamento,
};

/** .../departamentos/[id]/route.ts */
export const departamentoItemRoutes = {
  PUT: equipeController.updateDepartamento,
  DELETE: equipeController.removeDepartamento,
};

/** .../departamentos/[id]/permissoes/route.ts */
export const departamentoPermissoesRoutes = { PUT: equipeController.salvarMatriz };

/** apps/api/app/api/auth/senha/route.ts */
export const minhaSenhaRoutes = { PUT: equipeController.trocarMinhaSenha };
