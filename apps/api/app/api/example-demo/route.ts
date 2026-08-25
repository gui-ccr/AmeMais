import { corsPreflightResponse } from "@/middleware/cors";
import { listExamplesController, createExampleController } from "@/features/_example-demo/controller";

export const GET = listExamplesController;
export const POST = createExampleController;
export const OPTIONS = corsPreflightResponse;
