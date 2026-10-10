export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;
/** Igual ao limite da API e do bucket: a Vercel corta requisições acima de ~4,5 MB. */
export const TAMANHO_MAXIMO_FOTO_MB = 4;
export const TAMANHO_MAXIMO_FOTO_BYTES = TAMANHO_MAXIMO_FOTO_MB * 1024 * 1024;

/** Mensagem para mostrar quando a foto escolhida não serve (tipo ou tamanho), ou `null` se está ok. */
export function mensagemDeFotoInvalida(arquivo: File): string | null {
  if (!TIPOS_FOTO_ACEITOS.some((tipo) => tipo === arquivo.type)) {
    return "A foto deve ser JPG, PNG ou WebP";
  }
  if (arquivo.size > TAMANHO_MAXIMO_FOTO_BYTES) {
    return `A foto deve ter no máximo ${TAMANHO_MAXIMO_FOTO_MB} MB`;
  }
  return null;
}
