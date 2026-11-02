import { corsPreflightResponse } from "@/middleware/cors";
import { voluntarioStatusRoutes } from "@/features/voluntarios/routes";

export const PATCH = voluntarioStatusRoutes.PATCH;
export const OPTIONS = corsPreflightResponse;
