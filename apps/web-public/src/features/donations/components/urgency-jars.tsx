import type { Urgency } from "../types";
import { UrgencyJar } from "./urgency-jar";

export function UrgencyJars({ urgencies }: { urgencies: Urgency[] }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-6">
      {urgencies.map((urgency) => (
        <UrgencyJar key={urgency.id} urgency={urgency} />
      ))}
    </div>
  );
}
