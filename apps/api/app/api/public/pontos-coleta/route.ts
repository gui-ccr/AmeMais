import { corsPreflightResponse } from "@/middleware/cors";
import { publicCollectionPointRoutes } from "@/features/public/routes";

export const GET = publicCollectionPointRoutes.GET;
export const OPTIONS = corsPreflightResponse;
