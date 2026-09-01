"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { PawPrint } from "lucide-react";
import { gsap } from "@/lib/gsap";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out", duration: 0.8 } })
        .from("[data-hero-eyebrow]", { opacity: 0, y: 16 })
        .from("[data-hero-title]", { opacity: 0, y: 24 }, "-=0.5")
        .from("[data-hero-subtitle]", { opacity: 0, y: 20 }, "-=0.5")
        .from("[data-hero-cta]", { opacity: 0, y: 16, stagger: 0.1 }, "-=0.4");
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative flex min-h-130 items-end">
      <Image
        src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1800&q=70"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,14,10,.78)] via-[rgba(20,14,10,.25)] to-[rgba(20,14,10,.1)]" />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-13.5 text-white">
        <p data-hero-eyebrow className="font-display text-3xl text-brand-terracotta-subtle">
          Teófilo Otoni · MG
        </p>
        <h1
          data-hero-title
          className="mt-1 mb-2.5 max-w-160 font-display text-6xl leading-none font-bold md:text-7xl"
        >
          Todo animal merece um lar que o ame mais.
        </h1>
        <p data-hero-subtitle className="mb-5.5 max-w-130 text-xl leading-snug text-brand-sand">
          Somos uma ONG de proteção animal que resgata, cuida e encontra famílias para cães e gatos abandonados na
          nossa cidade.
        </p>
        <div className="flex flex-wrap gap-3.5">
          <Link
            data-hero-cta
            href="/adote"
            className="flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-xl text-white no-underline hover:bg-primary-hover hover:text-white"
          >
            Quero adotar <PawPrint className="size-5" />
          </Link>
          <Link
            data-hero-cta
            href="/doe"
            className="rounded-full bg-white px-7 py-3 text-xl text-foreground no-underline hover:bg-brand-sand hover:text-foreground"
          >
            Quero ajudar
          </Link>
        </div>
      </div>
    </section>
  );
}
