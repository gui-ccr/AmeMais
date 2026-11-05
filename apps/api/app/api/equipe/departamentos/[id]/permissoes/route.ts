import { corsPreflightResponse } from "@/middleware/cors";
import { departamentoPermissoesRoutes } from "@/features/equipe/routes";

export const PUT = departamentoPermissoesRoutes.PUT;
export const OPTIONS = corsPreflightResponse;
