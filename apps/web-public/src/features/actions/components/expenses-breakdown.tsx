import { ProgressBar } from "@/components/ui/progress-bar";
import type { Expense } from "../types";

export function ExpensesBreakdown({ expenses }: { expenses: Expense[] }) {
  return (
    <div className="mt-9 rounded-2xl border-2 border-border bg-brand-sand p-6.5">
      <h2 className="mb-2.5 font-display text-4xl font-bold">Para onde vai o dinheiro</h2>
      <div className="flex max-w-140 flex-col gap-2.5">
        {expenses.map((expense) => (
          <div key={expense.id}>
            <div className="flex justify-between text-lg">
              <span>{expense.name}</span>
              <b>{expense.percentLabel}</b>
            </div>
            <ProgressBar percent={expense.percent} color={expense.color} track="white" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-base text-muted-foreground">
        Média mensal de 2026 · prestação de contas completa disponível a pedido, no nosso WhatsApp.
      </p>
    </div>
  );
}
