import type { Especie } from "./types";

export const ESPECIE_INFO: Record<Especie, { rotulo: string }> = {
  cachorro: { rotulo: "Cachorro" },
  gato: { rotulo: "Gato" },
  outro: { rotulo: "Outro" },
};

export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;
export const TAMANHO_MAXIMO_FOTO_MB = 5;
export const TAMANHO_MAXIMO_FOTO_BYTES = TAMANHO_MAXIMO_FOTO_MB * 1024 * 1024;
