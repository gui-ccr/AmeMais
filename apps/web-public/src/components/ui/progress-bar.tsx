"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap } from "@/lib/gsap";

export function ProgressBar({
  percent,
  color = "primary",
  track = "light",
}: {
  percent: number;
  color?: "primary" | "secondary";
  track?: "light" | "white";
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { width: "0%" },
        {
          width: `${percent}%`,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [percent]);

  return (
    <div
      className={cn(
        "mt-2.5 h-2.5 overflow-hidden rounded-md",
        track === "white" ? "border-2 border-border bg-white" : "bg-border-light",
      )}
    >
      <div ref={barRef} className={cn("h-full rounded-md", color === "primary" ? "bg-primary" : "bg-secondary")} />
    </div>
  );
}
