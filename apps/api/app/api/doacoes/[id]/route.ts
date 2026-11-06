import { corsPreflightResponse } from "@/middleware/cors";
import { doacaoItemRoutes } from "@/features/doacoes/routes";

export const GET = doacaoItemRoutes.GET;
export const PUT = doacaoItemRoutes.PUT;
export const PATCH = doacaoItemRoutes.PATCH;
export const DELETE = doacaoItemRoutes.DELETE;
export const OPTIONS = corsPreflightResponse;
