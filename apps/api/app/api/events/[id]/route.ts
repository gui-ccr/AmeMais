import { corsPreflightResponse } from "@/middleware/cors";
import { eventItemRoutes } from "@/features/events/routes";

export const GET = eventItemRoutes.GET;
export const PATCH = eventItemRoutes.PATCH;
export const DELETE = eventItemRoutes.DELETE;
export const OPTIONS = corsPreflightResponse;
