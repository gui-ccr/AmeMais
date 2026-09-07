"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { gsap } from "@/lib/gsap";

export function Story() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-11 px-6 py-15"
    >
      <div>
        <Eyebrow>Nossa história</Eyebrow>
        <h2 className="mt-1 mb-3.5 font-display text-5xl leading-tight font-bold">
          Começamos com uma caixa de papelão e muito amor.
        </h2>
        <p className="mb-3 text-xl leading-snug">
          Em 2019, um grupo de vizinhos do bairro Ipiranga se juntou para cuidar de uma ninhada abandonada perto do
          córrego. O que era um gesto pontual virou a AmeMais: uma rede de voluntários que resgata, trata e encontra
          famílias para animais em situação de rua em Teófilo Otoni.
        </p>
        <p className="mb-5 text-xl leading-snug">
          Não temos um abrigo físico — trabalhamos com <b>lares temporários</b>: casas de voluntários que acolhem
          cada animal até a adoção. Assim, cada resgatado recebe atenção de verdade.
        </p>
        <Link
          href="/sobre"
          className="inline-block rounded-full border-2 border-border px-6 py-2 text-xl text-foreground no-underline hover:bg-secondary hover:text-white"
        >
          Conheça nosso trabalho →
        </Link>
      </div>
      <div className="relative">
        <div className="relative h-90 w-full overflow-hidden rounded-2xl border-2 border-border">
          <Image
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&q=70"
            alt="Voluntária passeando com cães resgatados"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute -bottom-4 right-4.5 -rotate-2 flex items-center gap-1.5 rounded-lg border-2 border-border bg-white px-4 py-2 font-display text-2xl">
          desde 2019 <Heart className="size-4.5 fill-current text-primary" />
        </div>
      </div>
    </section>
  );
}
