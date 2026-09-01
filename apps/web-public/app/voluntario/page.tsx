import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { HelpOptionsGrid } from "@/features/volunteering/components/help-options-grid";
import { VolunteerForm } from "@/features/volunteering/components/volunteer-form";

export const metadata: Metadata = { title: "Seja Voluntário — AmeMais" };

export default function VoluntarioPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-11 pb-15">
      <PageHeader
        eyebrow="Rede de apoio"
        title="Seja um lar temporário (ou ajude do seu jeito)"
        description="Lar temporário é quem acolhe um animal em casa até a adoção. A AmeMais cobre ração e despesas veterinárias — você entra com o carinho."
      />

      <HelpOptionsGrid />
      <VolunteerForm />
    </div>
  );
}
