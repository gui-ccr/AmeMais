import { corsPreflightResponse } from "@/middleware/cors";
import { animalCollectionRoutes } from "@/features/animals/routes";

export const GET = animalCollectionRoutes.GET;
export const POST = animalCollectionRoutes.POST;
export const OPTIONS = corsPreflightResponse;
