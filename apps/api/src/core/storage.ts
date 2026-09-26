import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { ForbiddenError, StorageError, ValidationError } from "./errors";

export const DEFAULT_STORAGE_BUCKET = "animal-photos";

/**
 * Quando o envio é feito como o usuário (`options.client`), a RLS de
 * `storage.objects` pode negá-lo — o mesmo caso do 42501 nas tabelas
 * (`throwOnWriteError`): vira 403, não um 500 genérico.
 */
function erroDeStorage(error: { message?: string; statusCode?: string | number }): ForbiddenError | StorageError {
  const negadoPelaRls = String(error.statusCode) === "403" || /row-level security/i.test(error.message ?? "");
  return negadoPelaRls ? new ForbiddenError() : new StorageError(error);
}

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
  /**
   * Client a usar no envio. Padrão: `supabaseAdmin` (service role, ignora a
   * RLS do Storage). Passe o client do usuário (`createSupabaseForUser`) para
   * que as policies de `storage.objects` decidam quem pode enviar.
   */
  client?: SupabaseClient;
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
export function getPublicUrl(
  path: string,
  bucket: string = DEFAULT_STORAGE_BUCKET,
  client: SupabaseClient = supabaseAdmin,
): string {
  if (!path || !path.trim()) {
    throw new ValidationError("Caminho do arquivo é obrigatório");
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
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
  const client = options?.client ?? supabaseAdmin;

  try {
    const { data, error } = await client.storage.from(bucket).upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? false,
    });

    if (error) {
      throw erroDeStorage(error);
    }

    const publicUrl = getPublicUrl(data.path, bucket, client);

    return {
      path: data.path,
      publicUrl,
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof StorageError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new StorageError(error);
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
      throw new StorageError(error);
    }
  } catch (error) {
    if (error instanceof ValidationError || error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(error);
  }
}
