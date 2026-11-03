import { corsPreflightResponse } from "@/middleware/cors";
import { membroCollectionRoutes } from "@/features/equipe/routes";

export const GET = membroCollectionRoutes.GET;
export const POST = membroCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;
