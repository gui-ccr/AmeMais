import { corsPreflightResponse } from "@/middleware/cors";
import { urgencyDonationRoutes } from "@/features/urgencies/routes";

export const POST = urgencyDonationRoutes.POST;
export const OPTIONS = corsPreflightResponse;
