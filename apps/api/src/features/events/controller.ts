import { NextRequest } from "next/server";
import { ok, created, fail } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { createEventSchema, updateEventSchema, eventIdParamSchema } from "./schema";
import { EventRepository } from "./event.repository";
import { ListEventsUseCase } from "./use-cases/list-events.use-case";
import { GetEventUseCase } from "./use-cases/get-event.use-case";
import { CreateEventUseCase } from "./use-cases/create-event.use-case";
import { UpdateEventUseCase } from "./use-cases/update-event.use-case";
import { DeleteEventUseCase } from "./use-cases/delete-event.use-case";

/**
 * Controller da feature Events: 1 método por endpoint. Cada método:
 * 1. extrai contexto HTTP (auth, params, body);
 * 2. valida a entrada com Zod;
 * 3. instancia o repository e o use case correspondente;
 * 4. executa o use case com os dados já validados e devolve a resposta.
 *
 * Nunca fala com o Supabase diretamente — quem faz isso é o repository,
 * por dentro do use case.
 */
export class EventController {
  list = async (request: NextRequest) => {
    try {
      await requireUser(request);

      const useCase = new ListEventsUseCase(new EventRepository());
      const events = await useCase.execute();

      return ok(events);
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await requireUser(request);
      const { id } = eventIdParamSchema.parse(params);

      const useCase = new GetEventUseCase(new EventRepository());
      const event = await useCase.execute(id);

      return ok(event);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      await requireRole(request, ["Admin", "Voluntário"]);
      const body = await request.json();
      const input = createEventSchema.parse(body);

      const useCase = new CreateEventUseCase(new EventRepository());
      const event = await useCase.execute(input);

      return created(event);
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await requireRole(request, ["Admin", "Voluntário"]);
      const { id } = eventIdParamSchema.parse(params);
      const body = await request.json();
      const input = updateEventSchema.parse(body);

      const useCase = new UpdateEventUseCase(new EventRepository());
      const event = await useCase.execute(id, input);

      return ok(event);
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await requireRole(request, ["Admin"]);
      const { id } = eventIdParamSchema.parse(params);

      const useCase = new DeleteEventUseCase(new EventRepository());
      await useCase.execute(id);

      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const eventController = new EventController();
