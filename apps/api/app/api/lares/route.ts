import { corsPreflightResponse } from "@/middleware/cors";
import { shelterCollectionRoutes } from "@/features/lares/routes";

export const GET = shelterCollectionRoutes.GET;
export const POST = shelterCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;

