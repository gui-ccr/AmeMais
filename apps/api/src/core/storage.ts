import { supabaseAdmin } from "@/lib/supabase";
import { StorageError, ValidationError } from "./errors";

export const DEFAULT_STORAGE_BUCKET = "animal-photos";

export type StorageFileBody =
  | Buffer
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | File
  | string;

export interface UploadOptions {
  bucket?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Retorna a URL pública de um arquivo armazenado no Supabase Storage.
 *
 * @param path Caminho do arquivo dentro do bucket
 * @param bucket Nome do bucket (padrão: "animal-photos")
 */
export function getPublicUrl(path: string, bucket: string = DEFAULT_STORAGE_BUCKET): string {
  if (!path || !path.trim()) {
    throw new ValidationError("Caminho do arquivo é obrigatório");
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Faz o upload de um arquivo/buffer para o Supabase Storage usando supabaseAdmin
 * (chave de service role para bypassar o RLS de escrita).
 *
 * @param path Caminho de destino no bucket (ex: "animais/foto-123.jpg")
 * @param file Buffer, Blob, File, ArrayBuffer ou string
 * @param options Opções como bucket customizado, contentType e sobrescrita (upsert)
 * @returns Objeto com o caminho e a URL pública do arquivo
 */
export async function uploadFile(
  path: string,
  file: StorageFileBody,
  options?: UploadOptions
): Promise<UploadResult> {
  if (!path || !path.trim()) {
    throw new ValidationError("Caminho do arquivo é obrigatório");
  }

  if (file === undefined || file === null) {
    throw new ValidationError("Arquivo para upload é obrigatório");
  }

  const bucket = options?.bucket || DEFAULT_STORAGE_BUCKET;

  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });

    if (error) {
      throw new StorageError(`Erro ao fazer upload do arquivo: ${error.message}`);
    }

    const publicUrl = getPublicUrl(data.path, bucket);

    return {
      path: data.path,
      publicUrl,
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof StorageError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Erro desconhecido ao fazer upload";
    throw new StorageError(`Erro ao fazer upload do arquivo: ${message}`);
  }
}

/**
 * Remove um arquivo do Supabase Storage usando supabaseAdmin.
 *
 * @param path Caminho do arquivo no bucket
 * @param bucket Nome do bucket (padrão: "animal-photos")
 */
export async function deleteFile(
  path: string,
  bucket: string = DEFAULT_STORAGE_BUCKET
): Promise<void> {
  if (!path || !path.trim()) {
    throw new ValidationError("Caminho do arquivo é obrigatório");
  }

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
    if (error) {
      throw new StorageError(`Erro ao remover arquivo: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof StorageError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Erro desconhecido ao remover arquivo";
    throw new StorageError(`Erro ao remover arquivo: ${message}`);
  }
}
