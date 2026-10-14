import { corsPreflightResponse } from "@/middleware/cors";
import { voluntarioItemRoutes } from "@/features/voluntarios/routes";

export const GET = voluntarioItemRoutes.GET;
export const PUT = voluntarioItemRoutes.PUT;
export const OPTIONS = corsPreflightResponse;
