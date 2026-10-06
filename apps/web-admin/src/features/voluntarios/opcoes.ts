import type { AreaDeAjuda, StatusVoluntario, TipoVoluntario } from "./types";

export const STATUS_VOLUNTARIO_INFO: Record<StatusVoluntario, { rotulo: string; variante: "success" | "muted" }> = {
  ativo: { rotulo: "Ativo", variante: "success" },
  inativo: { rotulo: "Inativo", variante: "muted" },
};

export const TIPO_VOLUNTARIO_INFO: Record<TipoVoluntario, { rotulo: string }> = {
  veterinario: { rotulo: "Veterinário(a)" },
  apoio_geral: { rotulo: "Apoio geral" },
};

/** Rótulos iguais aos do portal público, para a pessoa reconhecer o que marcou lá. */
export const AREA_DE_AJUDA_INFO: Record<AreaDeAjuda, { rotulo: string }> = {
  lar_temporario: { rotulo: "Lar temporário" },
  transporte: { rotulo: "Transporte de resgates" },
  eventos: { rotulo: "Eventos e feirinhas" },
  divulgacao: { rotulo: "Divulgação / redes sociais" },
};
