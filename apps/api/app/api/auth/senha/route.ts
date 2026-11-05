import { corsPreflightResponse } from "@/middleware/cors";
import { minhaSenhaRoutes } from "@/features/equipe/routes";

export const PUT = minhaSenhaRoutes.PUT;
export const OPTIONS = corsPreflightResponse;
