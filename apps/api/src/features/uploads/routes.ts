import { uploadController } from "./controller";

/**
 * Tabela de endpoints da feature:
 *  - uploadImageRoutes -> apps/api/app/api/uploads/imagem/route.ts (/api/uploads/imagem)
 *
 * O arquivo em app/ não tem lógica — só reexporta o que está aqui, porque o
 * Next.js exige o arquivo físico para registrar a rota.
 */
export const uploadImageRoutes = {
  POST: uploadController.uploadImage,
};
