import type { PublicUrgency } from "@amemais/shared-types";
import type { Urgency } from "../types";

const TAG_POR_PRIORIDADE: Record<PublicUrgency["prioridade"], string> = {
  urgente: "urgente",
  importante: "importante",
  continua: "contínuo",
};

const formatar = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** 0 a 100. Meta nula ou zero vira 0 (nunca NaN nem Infinity). */
export function calcularPercentual(arrecadado: number, meta: number | null): number {
  if (!meta || meta <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((arrecadado / meta) * 100)));
}

function montarRotulo({ unidade, valorArrecadado, metaArrecadacao }: PublicUrgency): string {
  if (unidade === "R$") {
    return metaArrecadacao
      ? `R$ ${formatar(valorArrecadado)} de R$ ${formatar(metaArrecadacao)}`
      : `R$ ${formatar(valorArrecadado)} arrecadados`;
  }
  return metaArrecadacao
    ? `${formatar(valorArrecadado)} de ${formatar(metaArrecadacao)} ${unidade}`
    : `${formatar(valorArrecadado)} ${unidade} arrecadados`;
}

/** Resposta da API pública -> tipo que o componente `UrgencyJar` já usa. */
export function mapUrgency(urgencia: PublicUrgency): Urgency {
  return {
    id: urgencia.id,
    title: urgencia.titulo,
    tag: TAG_POR_PRIORIDADE[urgencia.prioridade],
    progressLabel: montarRotulo(urgencia),
    percent: calcularPercentual(urgencia.valorArrecadado, urgencia.metaArrecadacao),
    color: urgencia.prioridade === "urgente" ? "primary" : "secondary",
  };
}
