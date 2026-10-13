"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { tiltForIndex } from "@/lib/tilt";
import type { CollectionPoint } from "../types";

export function CollectionPointTag({ point, index }: { point: CollectionPoint; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotate = tiltForIndex(index, 1.2);

  useEffect(() => {
    if (ref.current) gsap.set(ref.current, { rotate, transformOrigin: "center" });
  }, [rotate]);

  return (
    <div
      ref={ref}
      data-reveal-item
      className="relative border-2 border-dashed border-border bg-white px-4 py-3 shadow-[0_4px_10px_rgba(46,42,38,.12)]"
    >
      <div className="flex items-start gap-2">
        <MapPin className="size-4.5 shrink-0 text-primary" />
        <div>
          <b className="text-lg">{point.name}</b>
          <p className="text-sm text-muted-foreground">
            {point.address}
            {point.hours ? ` · ${point.hours}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
