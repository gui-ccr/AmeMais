import { VoluntarioList } from "@/features/voluntarios/components/voluntario-list";

export default function VoluntariosPage() {
  return (
    <section className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="border-b-2 border-secondary pb-6">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Rede de Voluntários</h1>
        <p className="text-muted-foreground text-lg mt-1">
          As pessoas que ajudam a ONG: como entrar em contato, como cada uma ajuda e quem abriga animais em casa.
        </p>
      </div>

      <VoluntarioList />
    </section>
  );
}
