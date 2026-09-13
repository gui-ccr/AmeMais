"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dog,
  Home,
  Calendar,
  AlertTriangle,
  Heart,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navigation = [
  { name: "Início", href: "/admin", icon: LayoutDashboard },
  { name: "Animais", href: "/admin/animais", icon: Dog },
  { name: "Lares", href: "/admin/lares", icon: Home },
  { name: "Eventos", href: "/admin/eventos", icon: Calendar },
  { name: "Urgências", href: "/admin/urgencias", icon: AlertTriangle },
  { name: "Interesses", href: "/admin/interesses", icon: Heart },
  { name: "Rede de Voluntários", href: "/admin/voluntarios", icon: HeartHandshake },
  { name: "Equipe e Acessos", href: "/admin/equipe", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex flex-col bg-sidebar-bg text-sidebar-fg border-r border-sidebar-border h-full min-h-screen">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border">
        <span className="text-xl font-bold font-display text-primary-light">
          AmeMais Admin
        </span>
      </div>
      <nav className="flex flex-1 flex-col p-4 gap-2">
        <ul className="flex flex-1 flex-col gap-2">
          {navigation.map((item) => {
            // Garante a correspondência exata para a rota raiz "/admin" para não ficar sempre ativa
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 transition-colors",
                    isActive
                      ? "bg-sidebar-active-bg text-sidebar-active-fg"
                      : "text-sidebar-muted hover:bg-secondary-hover hover:text-sidebar-fg"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}