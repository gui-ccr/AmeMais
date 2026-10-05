import type { UnidadeMeta } from "@/features/urgencias/types";
import type { CategoriaDoacao } from "./types";

/** `unidadeSugerida` só pré-preenche a unidade ao cadastrar; a pessoa pode trocar. */
export const CATEGORIA_INFO: Record<CategoriaDoacao, { rotulo: string; unidadeSugerida: UnidadeMeta }> = {
  racao: { rotulo: "Ração", unidadeSugerida: "kg" },
  medicamento: { rotulo: "Medicamentos", unidadeSugerida: "un" },
  higiene: { rotulo: "Higiene e limpeza", unidadeSugerida: "un" },
  cobertores: { rotulo: "Cobertores e abrigo", unidadeSugerida: "un" },
  dinheiro: { rotulo: "Dinheiro (PIX ou espécie)", unidadeSugerida: "R$" },
  outros: { rotulo: "Outros", unidadeSugerida: "un" },
};

/** "AAAA-MM-DDTHH:mm:ss…" (ISO) → "DD/MM/AAAA às HH:mm", no fuso do navegador. Vazio se a data for inválida. */
export function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";

  const dia = data.toLocaleDateString("pt-BR");
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
}
