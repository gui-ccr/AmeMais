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

      <div
        className="rounded-3xl border-2 border-border p-6 md:p-10"
        style={{
          backgroundColor: "#c9a876",
          backgroundImage:
            "radial-gradient(rgba(0,0,0,.14) 1px, transparent 1.4px), radial-gradient(rgba(255,255,255,.08) 1px, transparent 1.4px)",
          backgroundSize: "18px 18px, 22px 22px",
          backgroundPosition: "0 0, 9px 11px",
        }}
      >
        <Reveal
          selector="[data-reveal-item]"
          className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-6 gap-y-10"
        >
          {ACTIONS.map((action, index) => (
            <ActionCard key={action.id} action={action} index={index} />
          ))}
        </Reveal>
      </div>

      <ExpensesBreakdown expenses={EXPENSES} />
    </div>
  );
}
