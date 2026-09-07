import { corsPreflightResponse } from "@/middleware/cors";
import {
  listEventsController,
  createEventController,
} from "@/features/events/controller";

export const GET = listEventsController;
export const POST = createEventController;
export const OPTIONS = corsPreflightResponse;