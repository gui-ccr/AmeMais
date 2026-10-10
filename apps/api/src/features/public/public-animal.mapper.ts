import type { PublicAnimal } from "@amemais/shared-types";
import type { PublicAnimalRow } from "./public-animal.repository";

/** Só http(s): o site usa esta URL como `src` de imagem. Qualquer outra coisa vira "sem foto". */
function safePhotoUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Linha do banco -> contrato público (`@amemais/shared-types`). Monta o objeto
 * campo a campo de propósito: só sai o que está listado aqui, mesmo que a linha
 * traga mais coisa.
 */
export function mapRowToPublicAnimal(row: PublicAnimalRow): PublicAnimal {
  return {
    id: row.id,
    nome: row.nome,
    // o banco aceita especie nula; o contrato público não
    especie: row.especie ?? "Outro",
    porte: row.porte,
    faixaEtaria: row.faixa_etaria,
    idadeTexto: row.idade_texto,
    descricao: row.descricao,
    urlFoto: safePhotoUrl(row.url_foto),
  };
}
