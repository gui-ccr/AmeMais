"use client";

import Image from "next/image";
import { useState } from "react";

/** Lado do quadro da foto no cartão (`size-44` = 176px). */
const TAMANHO_FOTO_PX = 176;

/**
 * Foto do animal no cartão. Sem foto, ou se a URL falhar (arquivo apagado do
 * Storage, host fora do ar), mostra a imagem de reserva no lugar do quadro quebrado.
 */
export function PetPhoto({ src, name }: { src: string; name: string }) {
  const [falhou, setFalhou] = useState(false);

  if (!src || falhou) {
    return (
      <div
        role="img"
        aria-label={`${name} ainda não tem foto`}
        className="flex size-full items-center justify-center bg-brand-sand text-6xl"
      >
        🐾
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      // O quadro tem tamanho fixo em qualquer tela: pedir mais que isso (ex.: 25vw) baixa foto grande à toa.
      sizes={`${TAMANHO_FOTO_PX}px`}
      className="object-cover"
      onError={() => setFalhou(true)}
    />
  );
}
