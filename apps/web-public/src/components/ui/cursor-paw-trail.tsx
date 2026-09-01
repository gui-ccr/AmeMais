"use client";

import { useEffect, useRef } from "react";
import { PawPrint } from "lucide-react";
import { gsap } from "@/lib/gsap";

const POOL_SIZE = 14;
const MIN_INTERVAL_MS = 220;

/**
 * Faint paw prints that fade in near the cursor as it moves — a whisper of
 * the same motif from the 404 page, only here it follows a real visitor.
 * Desktop-only, and off entirely for prefers-reduced-motion.
 */
export function CursorPawTrail() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = containerRef.current;
    if (!container) return;

    const paws = gsap.utils.toArray<HTMLElement>(".cursor-paw", container);
    let index = 0;
    let side = 1;
    let lastSpawn = 0;

    function handleMove(event: MouseEvent) {
      const now = performance.now();
      if (now - lastSpawn < MIN_INTERVAL_MS) return;
      lastSpawn = now;

      const paw = paws[index % paws.length];
      index += 1;
      side *= -1;
      if (!paw) return;

      gsap.killTweensOf(paw);
      gsap.fromTo(
        paw,
        { x: event.clientX + 9 * side, y: event.clientY, opacity: 0.5, scale: 0.6, rotate: side * 22 },
        { opacity: 0, scale: 1, duration: 1.2, ease: "power1.out" },
      );
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: POOL_SIZE }).map((_, index) => (
        <PawPrint key={index} className="cursor-paw absolute top-0 left-0 size-4 text-primary opacity-0" />
      ))}
    </div>
  );
}
