import { corsPreflightResponse } from "@/middleware/cors";
import { membroSenhaProvisoriaRoutes } from "@/features/equipe/routes";

export const POST = membroSenhaProvisoriaRoutes.POST;
export const OPTIONS = corsPreflightResponse;
