"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * Wraps a CTA so it drifts gently toward the cursor on hover (desktop only).
 * Use sparingly — only on the one or two CTAs that matter most.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.35,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

    function handleMove(event: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
    }

    function reset() {
      xTo(0);
      yTo(0);
    }

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, [strength]);

  return (
    <div ref={ref} className={cn("inline-flex", className)} {...rest}>
      {children}
    </div>
  );
}
