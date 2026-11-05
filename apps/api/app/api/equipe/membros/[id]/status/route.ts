import { corsPreflightResponse } from "@/middleware/cors";
import { membroStatusRoutes } from "@/features/equipe/routes";

export const PATCH = membroStatusRoutes.PATCH;
export const OPTIONS = corsPreflightResponse;
