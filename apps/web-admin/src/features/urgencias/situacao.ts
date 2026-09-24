import { PRIORIDADE_INFO, formatarQuantidade } from "./opcoes";
import type { Urgencia } from "./types";

/**
 * Situação de uma urgência, derivada de meta/arrecadado/dataLimite — nunca
 * marcada à mão, para não ficar desatualizada em relação ao progresso real
 * (era o problema do antigo "Ativa/Atendida", que não dizia nada).
 */
export type ChaveSituacao = "atendida" | "vencida" | "vence-hoje" | "em-andamento";

export interface SituacaoUrgencia {
  chave: ChaveSituacao;
  rotulo: string;
  descricao: string;
  variante: "success" | "destructive" | "urgent" | "muted";
}

type UrgenciaParaSituacao = Pick<Urgencia, "meta" | "arrecadado" | "unidade" | "dataLimite">;

const MS_POR_DIA = 86_400_000;

/** "AAAA-MM-DD" de uma data simples ou ISO; null se não for uma data válida. */
export function extrairDia(data: string | null | undefined): string | null {
  const dia = data?.split("T")[0];
  return dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;
}

/** Dia de hoje no fuso local. `toISOString()` usaria UTC e viraria o dia às 21h no Brasil. */
export function hojeLocal(agora: Date = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

function diaParaUTC(dia: string): number {
  const [ano = 0, mes = 1, diaDoMes = 1] = dia.split("-").map(Number);
  return Date.UTC(ano, mes - 1, diaDoMes);
}

/** Dias de `de` até `ate` (negativo se `ate` já passou). */
export function diasEntre(de: string, ate: string): number {
  return Math.round((diaParaUTC(ate) - diaParaUTC(de)) / MS_POR_DIA);
}

/** "AAAA-MM-DD" → "DD/MM/AAAA", sem passar por Date (evita deslocamento de fuso). */
export function formatarDia(dia: string): string {
  const [ano, mes, diaDoMes] = dia.split("-");
  return `${diaDoMes}/${mes}/${ano}`;
}

/** Progresso de 0 a 100, ou null quando não há meta. */
export function calcularPercentual(meta: number | null, arrecadado: number): number | null {
  if (meta === null || meta <= 0) return null;
  return Math.min(100, Math.round((arrecadado / meta) * 100));
}

export function getSituacaoUrgencia(urgencia: UrgenciaParaSituacao, agora: Date = new Date()): SituacaoUrgencia {
  const { meta, arrecadado, unidade } = urgencia;
  const dia = extrairDia(urgencia.dataLimite);
  const dias = dia ? diasEntre(hojeLocal(agora), dia) : null;
  const faltam = meta !== null ? Math.max(meta - arrecadado, 0) : null;

  if (meta !== null && meta > 0 && arrecadado >= meta) {
    return {
      chave: "atendida",
      rotulo: "Atendida",
      descricao: `Meta de ${formatarQuantidade(meta, unidade)} atingida.`,
      variante: "success",
    };
  }

  if (dias !== null && dias < 0) {
    const quando = dias === -1 ? "ontem" : `há ${-dias} dias`;
    const restante = faltam !== null ? ` Ainda faltam ${formatarQuantidade(faltam, unidade)}.` : "";
    return { chave: "vencida", rotulo: "Prazo vencido", descricao: `O prazo terminou ${quando}.${restante}`, variante: "destructive" };
  }

  const partes: string[] = [];
  partes.push(faltam !== null ? `Faltam ${formatarQuantidade(faltam, unidade)}` : "Sem quantidade definida");

  if (dias === 0) {
    partes.push("o prazo termina hoje");
    return { chave: "vence-hoje", rotulo: "Vence hoje", descricao: `${partes.join(" — ")}.`, variante: "urgent" };
  }

  if (dias !== null) partes.push(`prazo ${dias === 1 ? "amanhã" : `em ${dias} dias`}`);
  return { chave: "em-andamento", rotulo: "Em andamento", descricao: `${partes.join(" · ")}.`, variante: "muted" };
}

/**
 * Ordem do mural: atendidas por último; depois urgente → importante →
 * contínua; dentro da mesma prioridade, prazo mais próximo primeiro (sem
 * prazo por último); por fim, a mais recente.
 */
export function compararUrgencias(a: Urgencia, b: Urgencia, agora: Date = new Date()): number {
  const atendidaA = getSituacaoUrgencia(a, agora).chave === "atendida" ? 1 : 0;
  const atendidaB = getSituacaoUrgencia(b, agora).chave === "atendida" ? 1 : 0;
  if (atendidaA !== atendidaB) return atendidaA - atendidaB;

  if (a.prioridade !== b.prioridade) {
    return PRIORIDADE_INFO[a.prioridade].ordem - PRIORIDADE_INFO[b.prioridade].ordem;
  }

  const diaA = extrairDia(a.dataLimite);
  const diaB = extrairDia(b.dataLimite);
  if (diaA !== diaB) {
    if (!diaA) return 1;
    if (!diaB) return -1;
    return diaA < diaB ? -1 : 1;
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
