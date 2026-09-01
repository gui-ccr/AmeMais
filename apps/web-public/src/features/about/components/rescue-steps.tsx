"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "@/components/ui/reveal";
import { gsap } from "@/lib/gsap";
import { RESCUE_STEPS } from "../data/rescue-steps";

export function RescueSteps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const path = pathRef.current;
    if (!container || !path) return;

    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

    const ctx = gsap.context(() => {
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top 75%",
          end: "bottom 65%",
          scrub: 0.6,
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox="0 0 1000 60"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-16 w-full -translate-y-1/2 md:block"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d="M20 30 C 150 -6, 280 66, 400 30 S 650 -6, 780 30 S 950 60, 980 30"
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.45}
        />
      </svg>
      <Reveal
        selector="[data-reveal-item]"
        className="relative grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
      >
        {RESCUE_STEPS.map((step) => (
          <div key={step.number} data-reveal-item className="rounded-2xl border-2 border-border bg-white p-4.5">
            <div className="font-display text-4xl leading-none font-bold text-primary">{step.number}</div>
            <b className="text-xl">{step.title}</b>
            <p className="mt-1 text-lg leading-snug text-muted-dark">{step.description}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );
}
