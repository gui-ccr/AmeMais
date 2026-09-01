"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

const PIX_KEY = "pix@amemais.org.br";

export function CopyPixButton({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie a chave PIX:", PIX_KEY);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2.5 rounded-lg bg-white px-3.5 py-2.5",
        compact ? "bg-brand-cream" : "mx-auto max-w-90 border-2 border-border",
      )}
    >
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-lg text-muted-dark">{PIX_KEY}</span>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-primary text-white hover:bg-primary-hover",
          compact ? "px-3.5 py-1 text-base" : "px-4 py-1.5 text-lg",
        )}
      >
        {copied ? (
          <>
            <Check className="size-4" /> copiado!
          </>
        ) : (
          <>
            <Copy className="size-4" /> copiar
          </>
        )}
      </button>
    </div>
  );
}
