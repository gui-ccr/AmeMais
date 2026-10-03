"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, X } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
import { whatsappLink } from "@/lib/whatsapp";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border bg-brand-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-2.5">
        <Link href="/" className="flex items-center gap-2.5 text-foreground no-underline">
          <Image
            src="/logo-amemais.jpg"
            alt="Logo AmeMais"
            width={44}
            height={44}
            className="rounded-full border-2 border-border object-cover"
          />
          <span className="font-display text-3xl font-bold leading-none">AmeMais</span>
        </Link>

        <nav className="hidden flex-1 flex-wrap items-center gap-4.5 text-lg md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b-[3px] border-transparent pb-0.5 no-underline",
                  isActive ? "border-primary text-primary" : "text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden md:block">
          <MagneticButton strength={0.25}>
            <a
              href={whatsappLink("Oi! Quero ajudar a AmeMais com uma doação 💚")}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-lg text-white no-underline hover:bg-primary-hover hover:text-white"
            >
              <Heart className="size-4.5 fill-current" /> Doar PIX
            </a>
          </MagneticButton>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          className="ml-auto flex items-center justify-center rounded-full border-2 border-border p-2 text-foreground md:hidden"
        >
          <Menu className="size-6" />
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-brand-charcoal/50 transition-opacity duration-300 md:hidden",
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      />

      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col gap-6 border-l-2 border-border bg-brand-cream px-6 py-5 shadow-xl transition-transform duration-300 ease-out md:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-bold leading-none">Menu</span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Fechar menu"
            className="flex items-center justify-center rounded-full border-2 border-border p-2 text-foreground"
          >
            <X className="size-6" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 text-lg">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-3 no-underline transition-colors",
                  isActive ? "bg-primary-light font-bold text-primary" : "text-foreground hover:bg-brand-sand",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <a
          href={whatsappLink("Oi! Quero ajudar a AmeMais com uma doação 💚")}
          target="_blank"
          rel="noreferrer"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-lg text-white no-underline hover:bg-primary-hover hover:text-white"
        >
          <Heart className="size-4.5 fill-current" /> Doar PIX
        </a>
      </div>
    </header>
  );
}
