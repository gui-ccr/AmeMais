import { NextRequest } from "next/server";
import { created, fail, ok } from "@/core/http";
import { requireRole } from "@/middleware/rbac";
import { createEventSchema, updateEventSchema } from "./schema";
import { eventService } from "./service";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

/**
 * Auxiliar para resolução do ID em Route Handlers do Next.js 14/15.
 */
async function resolveId(context: RouteContext): Promise<string> {
  const resolved = await context.params;
  return resolved.id;
}

/**
 * Validação de permissões para ações administrativas de escrita.
 * Caso haja header Authorization, exige perfil de Admin ou Voluntário.
 */
async function checkWritePermissions(request: NextRequest): Promise<void> {
  if (request.headers.get("authorization")) {
    await requireRole(request, ["Admin", "Voluntário"]);
  }
}

/**
 * GET /api/eventos
 * Lista todos os eventos cadastrados na agenda da ONG.
 */
export async function listEventsController(_request: NextRequest) {
  try {
    const events = await eventService.listEvents();
    return ok(events);
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/eventos/[id]
 * Retorna os detalhes de um evento específico por ID.
 */
export async function getEventByIdController(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const id = await resolveId(context);
    const event = await eventService.getEventById(id);
    return ok(event);
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/eventos
 * Cadastra um novo evento na agenda após validar payload via Zod.
 */
export async function createEventController(request: NextRequest) {
  try {
    await checkWritePermissions(request);

    const body = await request.json();
    const input = createEventSchema.parse(body);
    const event = await eventService.createEvent(input);

    return created(event);
  } catch (error) {
    return fail(error);
  }
}

/**
 * PUT / PATCH /api/eventos/[id]
 * Atualiza um evento existente.
 */
export async function updateEventController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await checkWritePermissions(request);

    const id = await resolveId(context);
    const body = await request.json();
    const input = updateEventSchema.parse(body);
    const event = await eventService.updateEvent(id, input);

    return ok(event);
  } catch (error) {
    return fail(error);
  }
}

/**
 * DELETE /api/eventos/[id]
 * Remove um evento da agenda.
 */
export async function deleteEventController(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await checkWritePermissions(request);

    const id = await resolveId(context);
    await eventService.deleteEvent(id);

    return ok({ message: "Evento removido com sucesso" });
  } catch (error) {
    return fail(error);
  }
}

