/**
 * Espécies que um animal aceita. Mesma lista do CHECK `animais_especie_check`
 * (migration 20260925211000) e do formulário de cadastro do admin.
 */
export const ESPECIES = ["Cachorro", "Gato", "Outro"] as const;
export type Especie = (typeof ESPECIES)[number];
