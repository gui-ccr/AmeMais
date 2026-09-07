const STEPS = [
  "Você chama no WhatsApp dizendo qual animal quer conhecer;",
  "Fazemos uma conversa rápida (entrevista) para entender a rotina da casa;",
  "Marcamos a visita no lar temporário onde o animal está;",
  "Assinatura do termo de adoção responsável e... pronto, ele é seu! 🐾",
];

export function AdoptionProcess() {
  return (
    <div className="max-w-190 rounded-2xl border-2 border-border bg-brand-sand p-6.5">
      <ol className="m-0 list-decimal space-y-1 pl-5.5 text-xl leading-loose">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-2.5 text-lg text-muted-foreground">
        Acompanhamos os primeiros 60 dias com check-ins pelo WhatsApp.
      </p>
    </div>
  );
}
