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
import { useProfile } from "@/features/auth/hooks/use-profile";
import { useSession } from "@/features/auth/hooks/use-session";
import { cn } from "@/lib/cn";

const navigation = [
  { name: "Início", href: "/admin", icon: LayoutDashboard },
  { name: "Animais", href: "/admin/animais", icon: Dog },
  { name: "Lares", href: "/admin/lares", icon: Home },
  { name: "Eventos", href: "/admin/eventos", icon: Calendar },
  { name: "Urgências", href: "/admin/urgencias", icon: AlertTriangle },
  { name: "Doações", href: "/admin/doacao", icon: Heart },
  { name: "Rede de Voluntários", href: "/admin/voluntarios", icon: HeartHandshake },
  { name: "Equipe e Acessos", href: "/admin/equipe", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useSession();
  const { data: profile } = useProfile(session);

  const nomeExibido = profile?.nome || profile?.email || "Usuário";
  const inicial = nomeExibido.charAt(0).toUpperCase();
  const papel = profile?.departamentos?.join(", ");

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
      <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active-bg text-sm font-semibold text-sidebar-active-fg">
          {inicial}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-sidebar-fg">{nomeExibido}</span>
          {papel && <span className="truncate text-xs text-sidebar-muted">{papel}</span>}
        </div>
      </div>
    </aside>
  );
}