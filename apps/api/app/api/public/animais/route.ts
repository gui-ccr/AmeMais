import { corsPreflightResponse } from "@/middleware/cors";
import { publicAnimalRoutes } from "@/features/public/routes";

export const GET = publicAnimalRoutes.GET;
export const OPTIONS = corsPreflightResponse;
