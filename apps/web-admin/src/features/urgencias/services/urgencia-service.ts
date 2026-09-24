import type { Urgencia, UrgenciaFormValues } from "../types";

/**
 * MOCK TEMPORÁRIO: dados em memória, sem persistência real (somem ao recarregar
 * a página). O back ainda não tem `/api/urgencias` nesta versão — quando
 * existir, troque o corpo destas funções por chamadas Axios ao `apps/api`, no
 * mesmo formato de `apps/web-example/src/features/_example-demo/services/example-service.ts`.
 *
 * Atenção: o DTO do back só conhece titulo/descricao/metaArrecadacao/
 * valorArrecadado/isActive. `prioridade`, `tipo`, `dataLimite` e `unidade`
 * (ver `../types.ts`) precisam ser criados no banco e na API antes de essa
 * troca funcionar por completo.
 */

/** Dia (AAAA-MM-DD) daqui a `dias` dias, para os dados de exemplo nunca "vencerem". */
function diaRelativo(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

let urgencias: Urgencia[] = [
  {
    id: crypto.randomUUID(),
    titulo: "Ração medicada (20kg)",
    descricao: "Para animais em tratamento no lar temporário.",
    prioridade: "urgente",
    tipo: "racao",
    dataLimite: diaRelativo(5),
    meta: 20,
    unidade: "kg",
    arrecadado: 9,
    ativo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    titulo: "Patês e sachês",
    descricao: "Para filhotes e animais debilitados.",
    prioridade: "importante",
    tipo: "racao",
    dataLimite: null,
    meta: 40,
    unidade: "un",
    arrecadado: 12,
    ativo: true,
    createdAt: new Date().toISOString(),
  },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const urgenciaService = {
  async list(): Promise<Urgencia[]> {
    const ordenadas = [...urgencias].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return delay(ordenadas);
  },

  async create(input: UrgenciaFormValues): Promise<Urgencia> {
    const nova: Urgencia = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    urgencias = [nova, ...urgencias];
    return delay(nova);
  },

  async update(id: string, input: UrgenciaFormValues): Promise<Urgencia> {
    let atualizada: Urgencia | undefined;
    urgencias = urgencias.map((urgencia) => {
      if (urgencia.id !== id) return urgencia;
      atualizada = { ...urgencia, ...input };
      return atualizada;
    });
    if (!atualizada) throw new Error("Urgência não encontrada");
    return delay(atualizada);
  },

  async remove(id: string): Promise<void> {
    urgencias = urgencias.filter((urgencia) => urgencia.id !== id);
    return delay(undefined);
  },
};
