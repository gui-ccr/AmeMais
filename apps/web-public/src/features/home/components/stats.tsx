"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const STATS = [
  { value: 128, label: "animais resgatados" },
  { value: 96, label: "adoções realizadas" },
  { value: 14, label: "lares temporários ativos" },
  { value: 6, label: "bairros atendidos" },
];

export function Stats() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const numberEls = el.querySelectorAll<HTMLElement>("[data-stat-value]");
      numberEls.forEach((numberEl) => {
        const target = Number(numberEl.dataset.statValue);
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.4,
          ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            numberEl.textContent = String(Math.round(counter.value));
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="border-b-2 border-border bg-brand-sand">
      <div
        ref={containerRef}
        className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4.5 px-6 py-6.5 text-center"
      >
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div
              data-stat-value={stat.value}
              className="font-display text-5xl leading-none font-bold text-primary"
            >
              0
            </div>
            <div className="text-lg">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
