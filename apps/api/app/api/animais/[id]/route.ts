import { corsPreflightResponse } from "@/middleware/cors";
import {
  deleteAnimalController,
  getAnimalByIdController,
  updateAnimalController,
} from "@/features/animals/controller";

export const GET = getAnimalByIdController;
export const PUT = updateAnimalController;
export const PATCH = updateAnimalController;
export const DELETE = deleteAnimalController;
export const OPTIONS = corsPreflightResponse;
