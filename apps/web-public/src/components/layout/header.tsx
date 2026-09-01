"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
import { whatsappLink } from "@/lib/whatsapp";

export function Header() {
  const pathname = usePathname();

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

        <nav className="flex flex-1 flex-wrap items-center gap-4.5 text-lg">
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

        <a
          href={whatsappLink("Oi! Quero ajudar a AmeMais com uma doação 💚")}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-lg text-white no-underline hover:bg-primary-hover hover:text-white"
        >
          <Heart className="size-4.5 fill-current" /> Doar PIX
        </a>
      </div>
    </header>
  );
}
