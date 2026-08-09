import { corsPreflightResponse } from "@/middleware/cors";
import { listExamplesController, createExampleController } from "@/features/example/controller";

export const GET = listExamplesController;
export const POST = createExampleController;
export const OPTIONS = corsPreflightResponse;
