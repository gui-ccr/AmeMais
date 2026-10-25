import { NextRequest } from "next/server";
import { ok, created, fail, lerCorpoJson } from "@/core/http";
import { ValidationError } from "@/core/errors";
import { deleteFile, uploadFile } from "@/core/storage";
import { TAMANHO_MAXIMO_IMAGEM_BYTES } from "@/features/uploads/image-rules";
import { UploadImageUseCase } from "@/features/uploads/upload-image.use-case";
import { requireUser } from "@/middleware/auth";
import { avisarSiteDepois } from "@/lib/public-site";
import { createSupabaseForUser } from "@/lib/supabase";
import {
  createAnimalSchema,
  updateAnimalStatusSchema,
  animalIdParamSchema,
  type CreateAnimalDTO,
} from "./schema";
import { AnimalRepository } from "./animal.repository";
import { ListAnimalsUseCase } from "./use-cases/list-animals.use-case";
import { GetAnimalUseCase } from "./use-cases/get-animal.use-case";
import { CreateAnimalUseCase, type FotosDoAnimal } from "./use-cases/create-animal.use-case";
import { UpdateAnimalStatusUseCase } from "./use-cases/update-animal-status.use-case";
import { DeleteAnimalUseCase } from "./use-cases/delete-animal.use-case";

/**
 * O cadastro aceita dois formatos:
 *  - JSON (`Content-Type: application/json`): o corpo é o animal; a foto, se
 *    houver, vem como `urlFoto` (uma URL já existente);
 *  - multipart (`multipart/form-data`): o campo `dados` traz o JSON do animal e
 *    o campo `foto` traz o arquivo — a API envia a foto e grava o animal num
 *    pedido só, e a foto não fica no Storage se o cadastro falhar.
 */
async function lerCorpoDoCadastro(request: NextRequest): Promise<{ input: CreateAnimalDTO; foto?: Uint8Array }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return { input: createAnimalSchema.parse(await lerCorpoJson(request)) };
  }

  const form = await request.formData();

  const dados = form.get("dados");
  if (typeof dados !== "string") {
    throw new ValidationError("dados é obrigatório (JSON do animal)");
  }
  let json: unknown;
  try {
    json = JSON.parse(dados);
  } catch {
    throw new ValidationError("dados deve ser um JSON válido");
  }
  const input = createAnimalSchema.parse(json);

  const arquivo = form.get("foto");
  if (arquivo === null) return { input };
  if (!(arquivo instanceof File)) {
    throw new ValidationError("foto deve ser um arquivo");
  }
  // Recusa antes de ler o arquivo inteiro para a memória.
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM_BYTES) {
    throw new ValidationError(`a foto deve ter no máximo ${TAMANHO_MAXIMO_IMAGEM_BYTES / 1024 / 1024} MB`);
  }
  return { input, foto: new Uint8Array(await arquivo.arrayBuffer()) };
}

/**
 * Controller da feature Animals: 1 método por endpoint. Cada método:
 * 1. extrai contexto HTTP (auth, params, body);
 * 2. valida a entrada com Zod;
 * 3. instancia o repository (com um client Supabase autenticado como o
 *    próprio usuário — a RLS de `animais` decide o que ele pode fazer) e o
 *    use case correspondente;
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
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);

      const useCase = new ListAnimalsUseCase(new AnimalRepository(db));
      const animals = await useCase.execute();

      return ok(animals);
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = animalIdParamSchema.parse(await params);

      const useCase = new GetAnimalUseCase(new AnimalRepository(db));
      const animal = await useCase.execute(id);

      return ok(animal);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { input, foto } = await lerCorpoDoCadastro(request);

      // Envio como o usuário (a RLS do Storage decide quem pode subir foto);
      // a remoção usa o padrão (service role) de propósito: é só a limpeza de
      // um arquivo que esta mesma requisição acabou de criar, num caminho que
      // o servidor gerou.
      const uploadImage = new UploadImageUseCase((path, bytes, contentType) =>
        uploadFile(path, bytes, { client: db, contentType }),
      );
      const fotos: FotosDoAnimal = {
        enviar: (bytes) => uploadImage.execute({ tipo: "animal", bytes }),
        remover: (path) => deleteFile(path),
      };

      const useCase = new CreateAnimalUseCase(new AnimalRepository(db), fotos);
      const animal = await useCase.execute(input, foto);

      avisarSiteDepois("animais");
      return created(animal);
    } catch (error) {
      return fail(error);
    }
  };

  updateStatus = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = animalIdParamSchema.parse(await params);
      const body = await lerCorpoJson(request);
      const { status, adotante, dataAdocao } = updateAnimalStatusSchema.parse(body);

      const useCase = new UpdateAnimalStatusUseCase(new AnimalRepository(db));
      const animal = await useCase.execute(id, status, adotante || dataAdocao ? { adotante, dataAdocao } : undefined);

      avisarSiteDepois("animais");
      return ok(animal);
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = animalIdParamSchema.parse(await params);

      const useCase = new DeleteAnimalUseCase(new AnimalRepository(db));
      await useCase.execute(id);

      avisarSiteDepois("animais");
      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const animalController = new AnimalController();
