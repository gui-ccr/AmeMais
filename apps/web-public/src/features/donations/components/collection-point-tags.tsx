import { Reveal } from "@/components/ui/reveal";
import type { CollectionPoint } from "../types";
import { CollectionPointTag } from "./collection-point-tag";

export function CollectionPointTags({ points }: { points: CollectionPoint[] }) {
  return (
    <Reveal selector="[data-reveal-item]" className="flex flex-col gap-3">
      {points.map((point, index) => (
        <CollectionPointTag key={point.id} point={point} index={index} />
      ))}
    </Reveal>
  );
}
