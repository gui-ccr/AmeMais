/**
 * "AAAA-MM-DD" (ou ISO completo) → "DD/MM/AAAA", só reordenando o texto —
 * sem passar por `Date`, para o dia não "escorregar" com o fuso do navegador.
 * Devolve string vazia se não for uma data nesse formato.
 */
export function formatISODateToBR(value: string | null | undefined): string {
  const dia = value?.split("T")[0];
  const partes = dia?.split("-");
  if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia) || partes?.length !== 3) return "";

  const [ano, mes, diaDoMes] = partes;
  return `${diaDoMes}/${mes}/${ano}`;
}

/** Dia de hoje ("AAAA-MM-DD") no fuso local. `toISOString()` usaria UTC e viraria o dia às 21h no Brasil. */
export function diaDeHoje(agora: Date = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
