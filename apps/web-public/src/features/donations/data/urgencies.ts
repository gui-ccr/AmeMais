import type { Urgency } from "../types";

export const URGENCIES: Urgency[] = [
  {
    id: "racao",
    title: "20kg de ração medicada",
    tag: "urgente",
    progressLabel: "9 de 20kg arrecadados",
    percent: 45,
    color: "primary",
  },
  {
    id: "cobertores",
    title: "Cobertores para o inverno",
    tag: "contínuo",
    progressLabel: "14 de 20 cobertores",
    percent: 70,
    color: "secondary",
  },
  {
    id: "castracoes",
    title: "Custeio de 3 castrações",
    tag: "urgente",
    progressLabel: "R$ 180 de R$ 450",
    percent: 40,
    color: "primary",
  },
];
