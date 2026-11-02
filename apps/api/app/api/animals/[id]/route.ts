import { corsPreflightResponse } from "@/middleware/cors";
import { animalItemRoutes } from "@/features/animals/routes";

export const GET = animalItemRoutes.GET;
export const PUT = animalItemRoutes.PUT;
export const PATCH = animalItemRoutes.PATCH;
export const DELETE = animalItemRoutes.DELETE;
export const OPTIONS = corsPreflightResponse;
