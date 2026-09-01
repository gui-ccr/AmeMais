import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Reveal } from "@/components/ui/reveal";
import type { Urgency } from "../types";

export function UrgencyList({ urgencies }: { urgencies: Urgency[] }) {
  return (
    <Reveal selector="[data-reveal-item]">
      {urgencies.map((urgency) => (
        <div key={urgency.id} data-reveal-item className="mb-3 rounded-xl border-2 border-border bg-white p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <b className="flex items-center gap-1.5 text-xl">
              <TriangleAlert className="size-5 shrink-0 text-primary" /> {urgency.title}
            </b>
            <Badge variant="outline" size="sm" className="border-primary bg-transparent text-primary">
              {urgency.tag}
            </Badge>
          </div>
          <ProgressBar percent={urgency.percent} color={urgency.color} />
          <p className="mt-1 text-base text-muted-foreground">{urgency.progressLabel}</p>
        </div>
      ))}
    </Reveal>
  );
}
