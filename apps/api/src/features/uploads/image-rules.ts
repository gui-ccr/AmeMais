/**
 * Regras de imagem aceita no upload. Limite de 4 MB porque a Vercel corta
 * requisições acima de ~4,5 MB (e o bucket `animal-photos` tem o mesmo limite,
 * ver migration 20260925211000).
 */
export const TAMANHO_MAXIMO_IMAGEM_BYTES = 4 * 1024 * 1024;

export const TIPOS_DE_IMAGEM = ["image/jpeg", "image/png", "image/webp"] as const;
export type TipoDeImagem = (typeof TIPOS_DE_IMAGEM)[number];

export const EXTENSAO_POR_TIPO: Record<TipoDeImagem, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function comecaCom(bytes: Uint8Array, assinatura: readonly number[], deslocamento = 0): boolean {
  return assinatura.every((valor, i) => bytes[deslocamento + i] === valor);
}

/**
 * Descobre o tipo REAL da imagem pelos primeiros bytes (a "assinatura" do
 * formato). O `Content-Type`/nome que o cliente manda é só uma declaração e
 * qualquer um pode mentir — um HTML renomeado para `.jpg` não passa daqui.
 * Devolve `null` se não for JPEG, PNG nem WebP.
 */
export function detectarTipoDeImagem(bytes: Uint8Array): TipoDeImagem | null {
  if (comecaCom(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (comecaCom(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // WebP: "RIFF" + 4 bytes de tamanho + "WEBP"
  if (comecaCom(bytes, [0x52, 0x49, 0x46, 0x46]) && comecaCom(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}
