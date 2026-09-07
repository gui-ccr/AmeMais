"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const text = textRef.current;
    const path = pathRef.current;
    if (!wrap || !text || !path) return;

    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(text, { clipPath: "inset(0 100% 0 0)" });

    const ctx = gsap.context(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: wrap, start: "top 90%", once: true } })
        .to(text, { clipPath: "inset(0 0% 0 0)", duration: 0.55, ease: "power2.out" })
        .to(path, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, "-=0.15");
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="inline-block">
      <span ref={textRef} className={cn("block font-display text-2xl text-primary", className)}>
        {children}
      </span>
      <svg viewBox="0 0 130 8" preserveAspectRatio="none" className="mt-0.5 h-2 w-24" aria-hidden="true">
        <path
          ref={pathRef}
          d="M2 5 C 25 1, 55 7, 78 3 S 112 1, 128 4"
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
