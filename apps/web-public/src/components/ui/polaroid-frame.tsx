"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * Wraps a photo card so it looks pinned to a corkboard/scrapbook: a slight
 * fixed tilt (deterministic, from `rotate`) with a little washi-tape strip up
 * top, that straightens out on hover like someone lifting it off the board.
 */
export function PolaroidFrame({
  rotate,
  children,
  className,
}: {
  rotate: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) gsap.set(ref.current, { rotate, transformOrigin: "center" });
  }, [rotate]);

  return (
    <div
      ref={ref}
      data-reveal-item
      className={cn("relative bg-white p-2 pb-3 shadow-[0_6px_16px_rgba(46,42,38,.18)]", className)}
      onMouseEnter={() => ref.current && gsap.to(ref.current, { rotate: 0, y: -4, scale: 1.02, duration: 0.35, ease: "power2.out" })}
      onMouseLeave={() =>
        ref.current && gsap.to(ref.current, { rotate, y: 0, scale: 1, duration: 0.4, ease: "power2.out" })
      }
    >
      <span
        className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-3 bg-brand-terracotta-subtle/80"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
