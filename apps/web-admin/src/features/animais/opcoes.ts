import type { Especie, StatusAnimal } from "./types";

export const ESPECIE_INFO: Record<Especie, { rotulo: string }> = {
  Cachorro: { rotulo: "Cachorro" },
  Gato: { rotulo: "Gato" },
  Outro: { rotulo: "Outro" },
};

export const STATUS_INFO: Record<StatusAnimal, { rotulo: string; variante: "adocao" | "tratamento" | "neutral" }> = {
  disponivel: { rotulo: "Disponível", variante: "adocao" },
  em_tratamento: { rotulo: "Em tratamento", variante: "tratamento" },
  em_lar_temporario: { rotulo: "Lar temporário", variante: "neutral" },
  adotado: { rotulo: "Adotado", variante: "neutral" },
};

export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;
/** Igual ao limite da API e do bucket: a Vercel corta requisições acima de ~4,5 MB. */
export const TAMANHO_MAXIMO_FOTO_MB = 4;
export const TAMANHO_MAXIMO_FOTO_BYTES = TAMANHO_MAXIMO_FOTO_MB * 1024 * 1024;
