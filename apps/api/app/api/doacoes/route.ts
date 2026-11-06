import { corsPreflightResponse } from "@/middleware/cors";
import { doacaoCollectionRoutes } from "@/features/doacoes/routes";

export const GET = doacaoCollectionRoutes.GET;
export const POST = doacaoCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;
