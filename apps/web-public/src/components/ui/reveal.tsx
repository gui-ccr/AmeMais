"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

export function Reveal({
  children,
  className,
  selector,
  y = 24,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  /** CSS selector (relative to this wrapper) of the items to animate individually. Omit to animate the wrapper itself. */
  selector?: string;
  y?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = selector ? el.querySelectorAll(selector) : el;
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [selector, stagger, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
