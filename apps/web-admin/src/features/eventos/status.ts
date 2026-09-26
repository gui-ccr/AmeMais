import type { EventDTO } from "./types";

/**
 * Situação de um evento, derivada de `isActive` + `dataEvento`.
 *
 * A API só persiste esses dois campos (não existe coluna de status na tabela
 * `events`), então a "situação" é calculada aqui, no front, a partir deles —
 * assim ela nunca fica desatualizada em relação à data. Quando o back ganhar
 * um status próprio (ex.: cancelado/adiado), `getStatusEvento` é o único ponto
 * a trocar.
 */
export type StatusEvento = "rascunho" | "agendado" | "hoje" | "encerrado";

export interface StatusEventoInfo {
  chave: StatusEvento;
  rotulo: string;
  descricao: string;
  variante: "muted" | "success" | "urgent" | "neutral";
}

type EventoParaStatus = Pick<EventDTO, "isActive"> & { dataEvento?: string | null };

const MS_POR_DIA = 86_400_000;

/**
 * Extrai o dia ("AAAA-MM-DD") de uma data da API (ISO completo) ou do
 * `<input type="date">`. Usa só a parte da data, sem converter fuso — o mesmo
 * critério do `DataBadge` da listagem —, para o dia não "escorregar" para o
 * dia anterior/seguinte conforme o fuso do navegador.
 */
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

function diasEntre(de: string, ate: string): number {
  return Math.round((diaParaUTC(ate) - diaParaUTC(de)) / MS_POR_DIA);
}

/**
 * Regra do back (Event.validarPublicacao): só dá para publicar um evento com
 * data definida e que ainda não passou — o evento de hoje pode ser publicado.
 * Espelhada aqui para o form avisar antes de o usuário receber um 400. O back
 * compara o dia no fuso de Brasília; aqui usamos o dia local do navegador, que
 * é o mesmo para quem opera a ONG.
 */
export function dataPermitePublicar(dia: string, agora: Date = new Date()): boolean {
  return diasEntre(hojeLocal(agora), dia) >= 0;
}

export function getStatusEvento(evento: EventoParaStatus, agora: Date = new Date()): StatusEventoInfo {
  const dia = extrairDia(evento.dataEvento);

  if (!dia) {
    return {
      chave: "rascunho",
      rotulo: "Rascunho",
      descricao: "Sem data definida — só a equipe vê. Defina uma data para poder publicar.",
      variante: "muted",
    };
  }

  const diasAteEvento = diasEntre(hojeLocal(agora), dia);

  if (diasAteEvento < 0) {
    return {
      chave: "encerrado",
      rotulo: "Encerrado",
      descricao: "A data do evento já passou.",
      variante: "neutral",
    };
  }

  if (!evento.isActive) {
    return {
      chave: "rascunho",
      rotulo: "Rascunho",
      descricao: "Só a equipe vê. Publique para o evento aparecer no site.",
      variante: "muted",
    };
  }

  if (diasAteEvento === 0) {
    return {
      chave: "hoje",
      rotulo: "Acontece hoje",
      descricao: "Publicado no site e acontecendo hoje.",
      variante: "urgent",
    };
  }

  const quando = diasAteEvento === 1 ? "amanhã" : `em ${diasAteEvento} dias`;
  return {
    chave: "agendado",
    rotulo: "Agendado",
    descricao: `Publicado no site — acontece ${quando}.`,
    variante: "success",
  };
}
