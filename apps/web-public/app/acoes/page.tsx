import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { buildPageMetadata } from "@/lib/site";
import { ActionCard } from "@/features/actions/components/action-card";
import { ExpensesBreakdown } from "@/features/actions/components/expenses-breakdown";
import { ACTIONS } from "@/features/actions/data/actions";
import { EXPENSES } from "@/features/actions/data/expenses";

export const metadata: Metadata = buildPageMetadata({
  title: "Mural de Ações",
  description:
    "Veja os resgates, mutirões de castração e eventos já realizados pela AmeMais em Teófilo Otoni, com local, data e prestação de contas de para onde vai cada doação.",
  path: "/acoes",
});

export default function AcoesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-11 pb-15">
      <PageHeader
        eyebrow="Transparência"
        title="Mural de ações: o que já fizemos"
        description="Registro público de resgates, mutirões e eventos — com local e data. É assim que você sabe para onde vai cada doação."
      />

      <Reveal
        selector="[data-reveal-item]"
        className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5"
      >
        {ACTIONS.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </Reveal>

      <ExpensesBreakdown expenses={EXPENSES} />
    </div>
  );
}
