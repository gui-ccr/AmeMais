import { corsPreflightResponse } from "@/middleware/cors";
import { urgencyCollectionRoutes } from "@/features/urgencies/routes";

export const GET = urgencyCollectionRoutes.GET;
export const POST = urgencyCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;