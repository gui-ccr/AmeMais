import { corsPreflightResponse } from "@/middleware/cors";
import { publicUrgencyRoutes } from "@/features/public/routes";

export const GET = publicUrgencyRoutes.GET;
export const OPTIONS = corsPreflightResponse;
