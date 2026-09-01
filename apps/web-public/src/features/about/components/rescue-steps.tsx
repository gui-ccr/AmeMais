import { Reveal } from "@/components/ui/reveal";
import { RESCUE_STEPS } from "../data/rescue-steps";

export function RescueSteps() {
  return (
    <Reveal selector="[data-reveal-item]" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      {RESCUE_STEPS.map((step) => (
        <div key={step.number} data-reveal-item className="rounded-2xl border-2 border-border bg-white p-4.5">
          <div className="font-display text-4xl leading-none font-bold text-primary">{step.number}</div>
          <b className="text-xl">{step.title}</b>
          <p className="mt-1 text-lg leading-snug text-muted-dark">{step.description}</p>
        </div>
      ))}
    </Reveal>
  );
}
