import { corsPreflightResponse } from "@/middleware/cors";
import { voluntarioCollectionRoutes } from "@/features/voluntarios/routes";

export const GET = voluntarioCollectionRoutes.GET;
export const POST = voluntarioCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;
