import { corsPreflightResponse } from "@/middleware/cors";
import { dashboardRoutes } from "@/features/dashboard/routes";

export const GET = dashboardRoutes.GET;
export const OPTIONS = corsPreflightResponse;
