import { corsPreflightResponse } from "@/middleware/cors";
import { departamentoItemRoutes } from "@/features/equipe/routes";

export const PUT = departamentoItemRoutes.PUT;
export const DELETE = departamentoItemRoutes.DELETE;
export const OPTIONS = corsPreflightResponse;
