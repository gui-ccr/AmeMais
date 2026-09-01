"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/cn";

export function LottiePaw({ className }: { className?: string }) {
  return (
    <DotLottieReact
      src="/paw.lottie"
      loop
      autoplay
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
    />
  );
}
