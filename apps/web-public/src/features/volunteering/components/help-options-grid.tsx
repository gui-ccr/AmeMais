import { Reveal } from "@/components/ui/reveal";
import { HELP_OPTIONS } from "../data/help-options";

export function HelpOptionsGrid() {
  return (
    <Reveal
      selector="[data-reveal-item]"
      className="mb-8.5 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4"
    >
      {HELP_OPTIONS.map((option) => (
        <div key={option.title} data-reveal-item className="rounded-2xl border-2 border-border bg-white p-4.5">
          <option.icon className="size-8 text-primary" strokeWidth={1.75} />
          <b className="mt-1.5 block text-xl">{option.title}</b>
          <p className="mt-1 text-lg leading-snug text-muted-dark">{option.description}</p>
        </div>
      ))}
    </Reveal>
  );
}
