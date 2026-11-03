import { corsPreflightResponse } from "@/middleware/cors";
import { departamentoCollectionRoutes } from "@/features/equipe/routes";

export const GET = departamentoCollectionRoutes.GET;
export const POST = departamentoCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;
