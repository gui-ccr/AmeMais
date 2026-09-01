import { MapPin } from "lucide-react";
import type { CollectionPoint } from "../types";

export function CollectionPointsList({
  points,
  showHours = false,
}: {
  points: CollectionPoint[];
  showHours?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {points.map((point) => (
        <div
          key={point.id}
          className="flex items-baseline gap-2.5 rounded-lg border-2 border-border bg-white px-3.5 py-2.5"
        >
          <MapPin className="size-4.5 shrink-0 text-primary" />
          <div>
            <b className="text-lg">{point.name}</b>
            <p className="text-base text-muted-foreground">
              {point.address}
              {showHours ? ` · ${point.hours}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
