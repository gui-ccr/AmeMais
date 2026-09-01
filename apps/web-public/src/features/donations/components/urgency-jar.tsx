"use client";

import { useEffect, useId, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { gsap } from "@/lib/gsap";
import type { Urgency } from "../types";

// Fillable interior of the jar silhouette below, in SVG user units.
const FILL_TOP_Y = 26;
const FILL_BOTTOM_Y = 148;

export function UrgencyJar({ urgency }: { urgency: Urgency }) {
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const fill = fillRef.current;
    if (!wrap || !fill) return;

    const targetY = FILL_BOTTOM_Y - ((FILL_BOTTOM_Y - FILL_TOP_Y) * urgency.percent) / 100;
    gsap.set(fill, { attr: { y: FILL_BOTTOM_Y } });

    const ctx = gsap.context(() => {
      gsap.to(fill, {
        attr: { y: targetY },
        duration: 1.1,
        ease: "power2.out",
        scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
      });
    }, wrap);

    return () => ctx.revert();
  }, [urgency.percent]);

  const jarPath =
    "M35 10 H65 V26 C65 26 78 34 78 52 V128 C78 141 68 148 55 148 H45 C32 148 22 141 22 128 V52 C22 34 35 26 35 26 Z";

  return (
    <div ref={wrapRef} className="flex flex-col items-center gap-1.5 text-center">
      <svg viewBox="0 0 100 152" className="h-40 w-auto">
        <clipPath id={`jar-fill-${clipId}`}>
          <path d={jarPath} />
        </clipPath>
        <rect x="31" y="3" width="38" height="10" rx="3" fill="var(--secondary)" />
        <g clipPath={`url(#jar-fill-${clipId})`}>
          <rect
            ref={fillRef}
            x="18"
            y={FILL_BOTTOM_Y}
            width="64"
            height="150"
            fill={urgency.color === "primary" ? "var(--primary)" : "var(--secondary)"}
            opacity={0.85}
          />
        </g>
        <path d={jarPath} fill="none" stroke="var(--border)" strokeWidth={3} />
      </svg>
      <b className="flex items-center gap-1 text-lg leading-tight">
        <TriangleAlert className="size-4 shrink-0 text-primary" /> {urgency.title}
      </b>
      <span className="text-sm text-muted-foreground">{urgency.progressLabel}</span>
    </div>
  );
}
