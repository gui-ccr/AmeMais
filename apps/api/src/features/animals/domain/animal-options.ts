/**
 * Espécies que um animal aceita. Mesma lista do CHECK `animais_especie_check`
 * (migration 20260925211000) e do formulário de cadastro do admin.
 */
export const ESPECIES = ["Cachorro", "Gato", "Outro"] as const;
export type Especie = (typeof ESPECIES)[number];

/** Porte do animal. Mesma lista do CHECK `animais_porte_check` (migration 20261005160400). */
export const PORTES = ["P", "M", "G"] as const;
export type Porte = (typeof PORTES)[number];

/** Faixa etária. Mesma lista do CHECK `animais_faixa_etaria_check`. */
export const FAIXAS_ETARIAS = ["filhote", "adulto", "idoso"] as const;
export type FaixaEtaria = (typeof FAIXAS_ETARIAS)[number];

/** Valores que o banco já usa por padrão para animais sem essa informação. */
export const PORTE_PADRAO: Porte = "M";
export const FAIXA_ETARIA_PADRAO: FaixaEtaria = "adulto";

/** Limites dos textos livres. Mesmos dos CHECKs `animais_idade_texto_check` e `animais_descricao_check`. */
export const IDADE_TEXTO_MAX = 40;
export const DESCRICAO_MAX = 500;
