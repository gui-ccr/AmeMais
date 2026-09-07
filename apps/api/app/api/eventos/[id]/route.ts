import { corsPreflightResponse } from "@/middleware/cors";
import {
  deleteEventController,
  getEventByIdController,
  updateEventController,
} from "@/features/events/controller";

export const GET = getEventByIdController;
export const PUT = updateEventController;
export const PATCH = updateEventController;
export const DELETE = deleteEventController;
export const OPTIONS = corsPreflightResponse;

