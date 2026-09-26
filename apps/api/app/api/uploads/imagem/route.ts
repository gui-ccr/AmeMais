import { corsPreflightResponse } from "@/middleware/cors";
import { uploadImageRoutes } from "@/features/uploads/routes";

export const POST = uploadImageRoutes.POST;
export const OPTIONS = corsPreflightResponse;
