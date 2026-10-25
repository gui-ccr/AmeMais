import { NextRequest } from "next/server";
import { ok, created, fail, lerCorpoJson } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import { createEventSchema, updateEventSchema, eventIdParamSchema } from "./schema";
import { EventRepository } from "./event.repository";
import { ListEventsUseCase } from "./use-cases/list-events.use-case";
import { GetEventUseCase } from "./use-cases/get-event.use-case";
import { CreateEventUseCase } from "./use-cases/create-event.use-case";
import { UpdateEventUseCase } from "./use-cases/update-event.use-case";
import { DeleteEventUseCase } from "./use-cases/delete-event.use-case";

export class EventController {
  list = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);

      const useCase = new ListEventsUseCase(new EventRepository(db));
      const events = await useCase.execute();

      return ok(events);
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = eventIdParamSchema.parse(await params);

      const useCase = new GetEventUseCase(new EventRepository(db));
      const event = await useCase.execute(id);

      return ok(event);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const body = await lerCorpoJson(request);
      const input = createEventSchema.parse(body);

      const useCase = new CreateEventUseCase(new EventRepository(db));
      const event = await useCase.execute(input);

      return created(event);
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = eventIdParamSchema.parse(await params);
      const body = await lerCorpoJson(request);
      const input = updateEventSchema.parse(body);

      const useCase = new UpdateEventUseCase(new EventRepository(db));
      const event = await useCase.execute(id, input);

      return ok(event);
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = eventIdParamSchema.parse(await params);

      const useCase = new DeleteEventUseCase(new EventRepository(db));
      await useCase.execute(id);

      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const eventController = new EventController();
