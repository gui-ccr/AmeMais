import { randomUUID } from "node:crypto";
import { ValidationError } from "@/core/errors";
import {
  EXTENSAO_POR_TIPO,
  TAMANHO_MAXIMO_IMAGEM_BYTES,
  TIPOS_DE_IMAGEM,
  detectarTipoDeImagem,
  type TipoDeImagem,
} from "./image-rules";

/** Para que serve a imagem: define a pasta dentro do bucket. */
export const TIPOS_DE_UPLOAD = ["animal", "doacao"] as const;
export type TipoDeUpload = (typeof TIPOS_DE_UPLOAD)[number];

const PASTA_POR_TIPO: Record<TipoDeUpload, string> = {
  animal: "animais",
  doacao: "doacoes",
};

export interface UploadedImage {
  url: string;
  path: string;
}

/** Como o arquivo chega ao Storage — injetado pelo controller (Dependency Inversion). */
export type ImageUploader = (
  path: string,
  bytes: Uint8Array,
  contentType: TipoDeImagem,
) => Promise<{ path: string; publicUrl: string }>;

/**
 * Caso de uso: validar uma imagem e enviá-la ao Storage.
 *
 * Confere o tamanho e o tipo REAL do arquivo (pelos bytes, não pelo
 * Content-Type do cliente), gera um nome novo (nunca usa o nome enviado, que
 * poderia trazer caminho ou caracteres estranhos) e devolve a URL pública para
 * o front mandar em `urlFoto` no cadastro.
 */
export class UploadImageUseCase {
  constructor(private readonly uploader: ImageUploader) {}

  async execute(input: { tipo: TipoDeUpload; bytes: Uint8Array }): Promise<UploadedImage> {
    const { tipo, bytes } = input;

    if (bytes.byteLength === 0) {
      throw new ValidationError("o arquivo está vazio");
    }
    if (bytes.byteLength > TAMANHO_MAXIMO_IMAGEM_BYTES) {
      throw new ValidationError(`a imagem deve ter no máximo ${TAMANHO_MAXIMO_IMAGEM_BYTES / 1024 / 1024} MB`);
    }

    const tipoReal = detectarTipoDeImagem(bytes);
    if (!tipoReal) {
      throw new ValidationError(`a imagem deve ser ${TIPOS_DE_IMAGEM.map((t) => t.replace("image/", "")).join(", ")}`);
    }

    const path = `${PASTA_POR_TIPO[tipo]}/${randomUUID()}.${EXTENSAO_POR_TIPO[tipoReal]}`;
    const { path: pathSalvo, publicUrl } = await this.uploader(path, bytes, tipoReal);

    return { url: publicUrl, path: pathSalvo };
  }
}
