import { NextRequest } from "next/server";
import { paginated, created, ok, fail, lerCorpoJson } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import {
  createVoluntarioSchema,
  listVoluntariosQuerySchema,
  updateVoluntarioSchema,
  updateVoluntarioStatusSchema,
  voluntarioIdParamSchema,
} from "./schema";
import { VoluntarioRepository } from "./voluntario.repository";
import { ListVoluntariosUseCase } from "./use-cases/list-voluntarios.use-case";
import { CreateVoluntarioUseCase } from "./use-cases/create-voluntario.use-case";
import { GetVoluntarioUseCase } from "./use-cases/get-voluntario.use-case";
import { UpdateVoluntarioUseCase } from "./use-cases/update-voluntario.use-case";
import { UpdateVoluntarioStatusUseCase } from "./use-cases/update-voluntario-status.use-case";
import { DeleteVoluntarioUseCase } from "./use-cases/delete-voluntario.use-case";

/** Extrai os query params como objeto para o Zod — ausente vira `undefined` (não `null`), pra `.optional()`/`.default()` funcionarem. */
function lerQueryParams(searchParams: URLSearchParams) {
  const pick = (chave: string) => searchParams.get(chave) ?? undefined;
  return {
    busca: pick("busca"),
    tipo: pick("tipo"),
    status: pick("status"),
    area: pick("area"),
    page: pick("page"),
    limit: pick("limit"),
  };
}

export class VoluntarioController {
  list = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const query = listVoluntariosQuerySchema.parse(lerQueryParams(request.nextUrl.searchParams));

      const useCase = new ListVoluntariosUseCase(new VoluntarioRepository(db));
      const resultado = await useCase.execute(query);

      return paginated(resultado.items, { page: query.page, limit: query.limit, total: resultado.total });
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const body = await lerCorpoJson(request);
      const input = createVoluntarioSchema.parse(body);

      const useCase = new CreateVoluntarioUseCase(new VoluntarioRepository(db));
      const voluntario = await useCase.execute(input);

      return created(voluntario);
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = voluntarioIdParamSchema.parse(await params);

      const useCase = new GetVoluntarioUseCase(new VoluntarioRepository(db));
      const voluntario = await useCase.execute(id);

      return ok(voluntario);
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = voluntarioIdParamSchema.parse(await params);
      const body = await lerCorpoJson(request);
      const input = updateVoluntarioSchema.parse(body);

      const useCase = new UpdateVoluntarioUseCase(new VoluntarioRepository(db));
      const voluntario = await useCase.execute(id, input);

      return ok(voluntario);
    } catch (error) {
      return fail(error);
    }
  };

  updateStatus = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = voluntarioIdParamSchema.parse(await params);
      const input = updateVoluntarioStatusSchema.parse(await lerCorpoJson(request));

      const useCase = new UpdateVoluntarioStatusUseCase(new VoluntarioRepository(db));
      const voluntario = await useCase.execute(id, input);

      return ok(voluntario);
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = voluntarioIdParamSchema.parse(await params);

      const useCase = new DeleteVoluntarioUseCase(new VoluntarioRepository(db));
      await useCase.execute(id);

      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const voluntarioController = new VoluntarioController();
