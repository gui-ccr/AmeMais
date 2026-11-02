import { z } from "zod";
import { DESCRICAO_MAX, FAIXAS_ETARIAS, IDADE_TEXTO_MAX, PORTES } from "./types";

const MENSAGEM_PORTE = "Selecione o porte";
const MENSAGEM_FAIXA = "Selecione a faixa etária";

/**
 * Campos que o site público (/adote) mostra: porte, faixa etária, idade em texto e descrição.
 * Compartilhados pelo cadastro e pela edição; os limites espelham os da API e os CHECKs do banco.
 * Porte e faixa não têm valor inicial de propósito: a equipe escolhe, em vez de herdar M/adulto.
 */
export const camposPublicosSchema = {
  porte: z.enum(PORTES, { required_error: MENSAGEM_PORTE, invalid_type_error: MENSAGEM_PORTE }),
  faixaEtaria: z.enum(FAIXAS_ETARIAS, { required_error: MENSAGEM_FAIXA, invalid_type_error: MENSAGEM_FAIXA }),
  idadeTexto: z.string().trim().max(IDADE_TEXTO_MAX, `Use no máximo ${IDADE_TEXTO_MAX} caracteres`),
  descricao: z.string().trim().max(DESCRICAO_MAX, `Use no máximo ${DESCRICAO_MAX} caracteres`),
};

/** Valores iniciais dos textos opcionais (porte e faixa começam sem escolha). */
export const CAMPOS_PUBLICOS_VAZIOS = { idadeTexto: "", descricao: "" };

/** Nomes dos campos, para validar só esse bloco com `trigger`. */
export const NOMES_CAMPOS_PUBLICOS = ["porte", "faixaEtaria", "idadeTexto", "descricao"] as const;

export interface CamposPublicosForm {
  porte?: (typeof PORTES)[number];
  faixaEtaria?: (typeof FAIXAS_ETARIAS)[number];
  idadeTexto: string;
  descricao: string;
}
