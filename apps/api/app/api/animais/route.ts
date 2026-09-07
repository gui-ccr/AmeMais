import { corsPreflightResponse } from "@/middleware/cors";
import {
  createAnimalController,
  deleteAnimalController,
  listAnimalsController,
  updateAnimalController,
} from "@/features/animals/controller";

export const GET = listAnimalsController;
export const POST = createAnimalController;
export const PUT = updateAnimalController;
export const DELETE = deleteAnimalController;
export const OPTIONS = corsPreflightResponse;

