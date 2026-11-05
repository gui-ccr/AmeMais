import { corsPreflightResponse } from "@/middleware/cors";
import { membroDepartamentosRoutes } from "@/features/equipe/routes";

export const PUT = membroDepartamentosRoutes.PUT;
export const OPTIONS = corsPreflightResponse;
