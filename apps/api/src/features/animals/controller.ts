import { NextRequest } from "next/server";
import { ok, created, fail } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { requireRole } from "@/middleware/rbac";
import { createAnimalSchema, updateAnimalStatusSchema, animalIdParamSchema } from "./schema";
import { AnimalRepository } from "./animal.repository";
import { ListAnimalsUseCase } from "./use-cases/list-animals.use-case";
import { GetAnimalUseCase } from "./use-cases/get-animal.use-case";
import { CreateAnimalUseCase } from "./use-cases/create-animal.use-case";
import { UpdateAnimalStatusUseCase } from "./use-cases/update-animal-status.use-case";
import { DeleteAnimalUseCase } from "./use-cases/delete-animal.use-case";

/**
 * Controller da feature Animals: 1 método por endpoint. Cada método:
 * 1. extrai contexto HTTP (auth, params, body);
 * 2. valida a entrada com Zod;
 * 3. instancia o repository e o use case correspondente;
 * 4. executa o use case com os dados já validados e devolve a resposta.
 *
 * Nunca fala com o Supabase diretamente — quem faz isso é o repository,
 * por dentro do use case.
 *
 * Métodos são arrow functions de instância (não `class methods` comuns)
 * para poderem ser passados como referência (`animalController.list`) para
 * o roteamento do Next.js sem perder o `this`.
 */
export class AnimalController {
  list = async (request: NextRequest) => {
    try {
      await requireUser(request);

      const useCase = new ListAnimalsUseCase(new AnimalRepository());
      const animals = await useCase.execute();

      return ok(animals);
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await requireUser(request);
      const { id } = animalIdParamSchema.parse(params);

      const useCase = new GetAnimalUseCase(new AnimalRepository());
      const animal = await useCase.execute(id);

      return ok(animal);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      await requireRole(request, ["Admin", "Voluntário"]);
      const body = await request.json();
      const input = createAnimalSchema.parse(body);

      const useCase = new CreateAnimalUseCase(new AnimalRepository());
      const animal = await useCase.execute(input);

      return created(animal);
    } catch (error) {
      return fail(error);
    }
  };

  updateStatus = async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await requireRole(request, ["Admin", "Voluntário"]);
      const { id } = animalIdParamSchema.parse(params);
      const body = await request.json();
      const { status } = updateAnimalStatusSchema.parse(body);

      const useCase = new UpdateAnimalStatusUseCase(new AnimalRepository());
      const animal = await useCase.execute(id, status);

      return ok(animal);
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await requireRole(request, ["Admin"]);
      const { id } = animalIdParamSchema.parse(params);

      const useCase = new DeleteAnimalUseCase(new AnimalRepository());
      await useCase.execute(id);

      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const animalController = new AnimalController();
