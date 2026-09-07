import { NextRequest } from "next/server";
import { ok, created, fail } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import {
  createEventSchema,
  updateEventSchema,
} from "./schema";
import { eventService } from "./service";

export async function listEventsController(
  request: NextRequest,
) {
  try {
    await requireUser(request);

    const events = await eventService.listEvents();

    return ok(events);
  } catch (error) {
    return fail(error);
  }
}

export async function createEventController(
  request: NextRequest,
) {
  try {
    await requireRole(request, ["Admin", "Voluntário"]);

    const body = await request.json();

    const input = createEventSchema.parse(body);

    const event = await eventService.createEvent(input);

    return created(event);
  } catch (error) {
    return fail(error);
  }
}

export async function updateEventController(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["Admin", "Voluntário"]);

    const { id } = await params;

    const body = await request.json();

    const input = updateEventSchema.parse(body);

    const event = await eventService.updateEvent(id, input);

    return ok(event);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteEventController(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, ["Admin"]);

    const { id } = await params;

    await eventService.deleteEvent(id);

    return ok({
      message: "Evento excluído com sucesso",
    });
  } catch (error) {
    return fail(error);
  }
}