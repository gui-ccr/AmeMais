import { corsPreflightResponse } from "@/middleware/cors";
import {
  createEventController,
  listEventsController,
} from "@/features/events/controller";

export const GET = listEventsController;
export const POST = createEventController;
export const OPTIONS = corsPreflightResponse;

