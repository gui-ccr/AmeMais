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

/** Texto de apoio mostrado ao escolher um status nos formulários. */
export const STATUS_DESCRICAO: Record<StatusAnimal, string> = {
  disponivel: "Pronto para ser adotado.",
  em_tratamento: "Ainda se recuperando; não está pronto para adoção.",
  em_lar_temporario: "Está num lar temporário até ser adotado.",
  adotado: "Já tem família — informe os dados da adoção.",
};

/**
 * Para cada status atual, os status para onde ele pode ir — espelha a matriz
 * `ALLOWED_TRANSITIONS` de apps/api/.../domain/animal-status.vo.ts. Se o back
 * mudar a regra, a API continua recusando e o formulário mostra a mensagem dela.
 */
export const TRANSICOES_STATUS: Record<StatusAnimal, readonly StatusAnimal[]> = {
  disponivel: ["em_tratamento", "em_lar_temporario", "adotado"],
  em_tratamento: ["disponivel", "em_lar_temporario"],
  em_lar_temporario: ["disponivel", "em_tratamento", "adotado"],
  // Devolução: volta para a triagem, nunca direto para outro lar temporário.
  adotado: ["disponivel", "em_tratamento"],
};

export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;
/** Igual ao limite da API e do bucket: a Vercel corta requisições acima de ~4,5 MB. */
export const TAMANHO_MAXIMO_FOTO_MB = 4;
export const TAMANHO_MAXIMO_FOTO_BYTES = TAMANHO_MAXIMO_FOTO_MB * 1024 * 1024;
