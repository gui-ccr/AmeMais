import type { Expense } from "../types";

export const EXPENSES: Expense[] = [
  { id: "racao", name: "Ração e alimentação", percentLabel: "38%", percent: 38, color: "primary" },
  { id: "veterinario", name: "Veterinário e remédios", percentLabel: "34%", percent: 34, color: "secondary" },
  { id: "castracoes", name: "Castrações", percentLabel: "18%", percent: 18, color: "primary" },
  { id: "transporte", name: "Transporte e resgates", percentLabel: "10%", percent: 10, color: "secondary" },
];
