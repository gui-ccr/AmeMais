import { corsPreflightResponse } from "@/middleware/cors";
import { shelterAnimalItemRoutes } from "@/features/lares/routes";

export const DELETE = shelterAnimalItemRoutes.DELETE;
export const OPTIONS = corsPreflightResponse;
