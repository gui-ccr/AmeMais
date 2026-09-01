"use client";

import { useEffect, useRef } from "react";
import { PawPrint } from "lucide-react";
import { gsap } from "@/lib/gsap";

interface Paw {
  top: string;
  left: string;
  rotate: number;
}

// Larger, wider-spaced steps drifting left to right — reads as a dog trail.
const DOG_TRAIL: Paw[] = [
  { top: "14%", left: "4%", rotate: -18 },
  { top: "20%", left: "15%", rotate: 16 },
  { top: "17%", left: "26%", rotate: -14 },
  { top: "23%", left: "37%", rotate: 14 },
  { top: "20%", left: "49%", rotate: -12 },
  { top: "26%", left: "60%", rotate: 12 },
  { top: "23%", left: "71%", rotate: -10 },
  { top: "28%", left: "82%", rotate: 10 },
];

// Smaller, tighter-spaced steps drifting right to left — reads as a cat trail.
const CAT_TRAIL: Paw[] = [
  { top: "84%", left: "94%", rotate: 20 },
  { top: "80%", left: "86%", rotate: -18 },
  { top: "82%", left: "78%", rotate: 18 },
  { top: "77%", left: "70%", rotate: -16 },
  { top: "79%", left: "62%", rotate: 16 },
  { top: "75%", left: "54%", rotate: -14 },
  { top: "78%", left: "46%", rotate: 14 },
  { top: "74%", left: "38%", rotate: -12 },
  { top: "76%", left: "30%", rotate: 12 },
  { top: "72%", left: "22%", rotate: -10 },
  { top: "75%", left: "14%", rotate: 10 },
  { top: "71%", left: "6%", rotate: -8 },
];

function useWalkingTrail(options: { stagger: number; hold: number; repeatDelay: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const paws = gsap.utils.toArray<HTMLElement>(".paw-print", container);

      paws.forEach((paw) => {
        gsap.set(paw, {
          opacity: 0,
          scale: 0.4,
          rotate: Number(paw.dataset.rotate),
          transformOrigin: "center",
        });
      });

      gsap
        .timeline({ repeat: -1, repeatDelay: options.repeatDelay })
        .to(paws, { opacity: 0.9, scale: 1, duration: 0.35, stagger: options.stagger, ease: "back.out(1.6)" })
        .to(paws, { opacity: 0, duration: 0.5, stagger: 0.04 }, `+=${options.hold}`);
    }, container);

    return () => ctx.revert();
  }, [options.stagger, options.hold, options.repeatDelay]);

  return ref;
}

export function PawTrailBackground() {
  const dogRef = useWalkingTrail({ stagger: 0.4, hold: 1.4, repeatDelay: 1.2 });
  const catRef = useWalkingTrail({ stagger: 0.26, hold: 1.1, repeatDelay: 0.7 });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div ref={dogRef} className="absolute inset-0">
        {DOG_TRAIL.map((paw, index) => (
          <PawPrint
            key={`dog-${index}`}
            data-rotate={paw.rotate}
            className="paw-print absolute size-9 text-primary"
            style={{ top: paw.top, left: paw.left }}
          />
        ))}
      </div>
      <div ref={catRef} className="absolute inset-0">
        {CAT_TRAIL.map((paw, index) => (
          <PawPrint
            key={`cat-${index}`}
            data-rotate={paw.rotate}
            className="paw-print absolute size-5 text-secondary"
            style={{ top: paw.top, left: paw.left }}
          />
        ))}
      </div>
    </div>
  );
}
