import { corsPreflightResponse } from "@/middleware/cors";
import { shelterItemRoutes } from "@/features/lares/routes";

export const GET = shelterItemRoutes.GET;
export const PUT = shelterItemRoutes.PUT;
export const PATCH = shelterItemRoutes.PATCH;
export const DELETE = shelterItemRoutes.DELETE;
export const OPTIONS = corsPreflightResponse;
