import { corsPreflightResponse } from "@/middleware/cors";
import { shelterAnimalsRoutes } from "@/features/lares/routes";

export const POST = shelterAnimalsRoutes.POST;
export const OPTIONS = corsPreflightResponse;
