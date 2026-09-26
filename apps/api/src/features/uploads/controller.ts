import { NextRequest } from "next/server";
import { z } from "zod";
import { created, fail } from "@/core/http";
import { ValidationError } from "@/core/errors";
import { uploadFile } from "@/core/storage";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import { TAMANHO_MAXIMO_IMAGEM_BYTES } from "./image-rules";
import { TIPOS_DE_UPLOAD, UploadImageUseCase } from "./upload-image.use-case";

const uploadTipoSchema = z.enum(TIPOS_DE_UPLOAD).default("animal");

/**
 * Controller de upload de imagem (`POST /api/uploads/imagem`, multipart com
 * `file` e `tipo`). Segue o mesmo desenho das outras features: extrai o
 * contexto HTTP, valida, executa o use case e responde via `created`/`fail`.
 *
 * O envio ao Storage é feito autenticado COMO O USUÁRIO (não com a service
 * role): a policy de `storage.objects` decide quem pode subir foto — a mesma
 * regra de quem pode cadastrar animal. Sem permissão, o Storage nega e o
 * `uploadFile` devolve 403.
 */
export class UploadController {
  uploadImage = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);

      const form = await request.formData();
      const arquivo = form.get("file");
      const tipo = uploadTipoSchema.parse(form.get("tipo") ?? undefined);

      if (!(arquivo instanceof File)) {
        throw new ValidationError("file é obrigatório (multipart/form-data)");
      }
      // Recusa antes de ler o arquivo inteiro para a memória.
      if (arquivo.size > TAMANHO_MAXIMO_IMAGEM_BYTES) {
        throw new ValidationError(`a imagem deve ter no máximo ${TAMANHO_MAXIMO_IMAGEM_BYTES / 1024 / 1024} MB`);
      }

      const useCase = new UploadImageUseCase((path, bytes, contentType) =>
        uploadFile(path, bytes, { client: db, contentType }),
      );
      const imagem = await useCase.execute({ tipo, bytes: new Uint8Array(await arquivo.arrayBuffer()) });

      return created(imagem);
    } catch (error) {
      return fail(error);
    }
  };
}

export const uploadController = new UploadController();
