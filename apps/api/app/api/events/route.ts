import { corsPreflightResponse } from "@/middleware/cors";
import { eventCollectionRoutes } from "@/features/events/routes";

export const GET = eventCollectionRoutes.GET;
export const POST = eventCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;
