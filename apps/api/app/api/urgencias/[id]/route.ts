import { corsPreflightResponse } from "@/middleware/cors";
import { urgencyItemRoutes } from "@/features/urgencies/routes";

export const GET = urgencyItemRoutes.GET;
export const PATCH = urgencyItemRoutes.PATCH;
export const DELETE = urgencyItemRoutes.DELETE;
export const OPTIONS = corsPreflightResponse;