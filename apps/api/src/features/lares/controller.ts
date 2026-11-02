import { NextRequest } from "next/server";
import { ok, created, paginated, fail, lerCorpoJson } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import {
  createShelterSchema,
  updateShelterStatusSchema,
  shelterIdParamSchema,
  listSheltersQuerySchema,
  updateShelterSchema,
  addAnimalToShelterSchema,
  shelterAnimalParamSchema,
} from "./schema";
import { UpdateShelterUseCase } from "./use-cases/update-shelter.use-case";
import { AddAnimalToShelterUseCase } from "./use-cases/add-animal-to-shelter.use-case";
import { RemoveAnimalFromShelterUseCase } from "./use-cases/remove-animal-from-shelter.use-case";
import { ShelterRepository } from "./shelter.repository";
import { ListSheltersUseCase } from "./use-cases/list-shelters.use-case";
import { GetShelterUseCase } from "./use-cases/get-shelter.use-case";
import { CreateShelterUseCase } from "./use-cases/create-shelter.use-case";
import { UpdateShelterStatusUseCase } from "./use-cases/update-shelter-status.use-case";
import { DeleteShelterUseCase } from "./use-cases/delete-shelter.use-case";

/** Extrai os query params como objeto para o Zod — ausente vira `undefined` (não `null`), pra `.optional()`/`.default()` funcionarem. */
function lerQueryParams(searchParams: URLSearchParams) {
  const pick = (chave: string) => searchParams.get(chave) ?? undefined;
  return {
    status: pick("status"),
    busca: pick("busca"),
    comVagas: pick("comVagas"),
    limit: pick("limit"),
    offset: pick("offset"),
  };
}

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
      const query = listSheltersQuerySchema.parse(lerQueryParams(request.nextUrl.searchParams));

      const useCase = new ListSheltersUseCase(new ShelterRepository(db));
      const resultado = await useCase.execute(query);

      return paginated(resultado.items, { limit: query.limit, offset: query.offset, total: resultado.total });
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
      const body = await lerCorpoJson(request);
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
      const body = await lerCorpoJson(request);
      const { status } = updateShelterStatusSchema.parse(body);

      const useCase = new UpdateShelterStatusUseCase(new ShelterRepository(db));
      const shelter = await useCase.execute(id, status);

      return ok(shelter);
    } catch (error) {
      return fail(error);
    }
  };

  update = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = shelterIdParamSchema.parse(await params);
      const body = await lerCorpoJson(request);
      const dados = updateShelterSchema.parse(body);

      const useCase = new UpdateShelterUseCase(new ShelterRepository(db));
      const shelter = await useCase.execute(id, dados);

      return ok(shelter);
    } catch (error) {
      return fail(error);
    }
  };

  addAnimal = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = shelterIdParamSchema.parse(await params);
      const body = await lerCorpoJson(request);
      const { animalId } = addAnimalToShelterSchema.parse(body);

      const useCase = new AddAnimalToShelterUseCase(new ShelterRepository(db));
      const shelter = await useCase.execute(id, animalId);

      return ok(shelter);
    } catch (error) {
      return fail(error);
    }
  };

  removeAnimal = async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string; animalId: string }> },
  ) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id, animalId } = shelterAnimalParamSchema.parse(await params);

      const useCase = new RemoveAnimalFromShelterUseCase(new ShelterRepository(db));
      const shelter = await useCase.execute(id, animalId);

      return ok(shelter);
    } catch (error) {
      return fail(error);
    }
  };

  /** Inativa o lar (KAN-80) — não apaga a linha. */
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

      return ok({ inativado: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const shelterController = new ShelterController();

