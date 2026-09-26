import { NextRequest } from "next/server";
import { ok, created, fail } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import {
  createShelterSchema,
  updateShelterStatusSchema,
  shelterIdParamSchema,
} from "./schema";
import { ShelterRepository } from "./shelter.repository";
import { ListSheltersUseCase } from "./use-cases/list-shelters.use-case";
import { GetShelterUseCase } from "./use-cases/get-shelter.use-case";
import { CreateShelterUseCase } from "./use-cases/create-shelter.use-case";
import { UpdateShelterStatusUseCase } from "./use-cases/update-shelter-status.use-case";
import { DeleteShelterUseCase } from "./use-cases/delete-shelter.use-case";

/**
 * Controller da feature Lares Temporários: 1 método por endpoint. Cada método:
 * 1. extrai contexto HTTP e valida autenticação (requireUser);
 * 2. valida a entrada com Zod;
 * 3. instancia o repository (com client Supabase autenticado como o próprio usuário —
 *    a RLS e o RBAC de `lares_temporarios` decidem o que ele pode fazer via check_user_access('lares'))
 *    e o use case correspondente;
 * 4. executa o use case com os dados já validados e devolve a resposta HTTP.
 *
 * NOTA: Leitura e escrita de dados de lares são permitidas apenas para usuários autenticados (requireUser).
 */
export class ShelterController {
  list = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);

      const useCase = new ListSheltersUseCase(new ShelterRepository(db));
      const shelters = await useCase.execute();

      return ok(shelters);
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = shelterIdParamSchema.parse(await params);

      const useCase = new GetShelterUseCase(new ShelterRepository(db));
      const shelter = await useCase.execute(id);

      return ok(shelter);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const body = await request.json();
      const input = createShelterSchema.parse(body);

      const useCase = new CreateShelterUseCase(new ShelterRepository(db));
      const shelter = await useCase.execute(input);

      return created(shelter);
    } catch (error) {
      return fail(error);
    }
  };

  updateStatus = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = shelterIdParamSchema.parse(await params);
      const body = await request.json();
      const { status } = updateShelterStatusSchema.parse(body);

      const useCase = new UpdateShelterStatusUseCase(new ShelterRepository(db));
      const shelter = await useCase.execute(id, status);

      return ok(shelter);
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = shelterIdParamSchema.parse(await params);

      const useCase = new DeleteShelterUseCase(new ShelterRepository(db));
      await useCase.execute(id);

      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const shelterController = new ShelterController();

