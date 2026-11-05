"use client";

import Image from "next/image";
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
  Settings,
} from "lucide-react";
import { AvatarUsuario } from "@/features/auth/components/avatar-usuario";
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
  const papel = profile?.departamentos?.join(", ");

  return (
    <aside className="w-64 shrink-0 flex flex-col sticky top-0 h-screen bg-sidebar-bg text-sidebar-fg border-r border-sidebar-border">
      <div className="flex h-20 shrink-0 items-center gap-3 px-6 border-b border-sidebar-border">
        <Image
          src="/logo-amemais.jpg"
          alt="AmeMais"
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-2xl font-bold font-display leading-tight text-primary-light">
            AmeMais
          </span>
          <span className="truncate text-xs text-sidebar-muted">Painel interno</span>
        </div>
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
      <Link
        href="/admin/configuracoes"
        aria-label="Configurações da conta"
        className={cn(
          "flex items-center gap-3 border-t border-sidebar-border p-4 transition-colors hover:bg-secondary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
          pathname.startsWith("/admin/configuracoes") && "bg-sidebar-active-bg",
        )}
      >
        <AvatarUsuario nome={nomeExibido} fotoUrl={profile?.fotoUrl} className="h-9 w-9 text-sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-sidebar-fg">{nomeExibido}</span>
          {papel && <span className="truncate text-xs text-sidebar-muted">{papel}</span>}
        </div>
        <Settings className="h-4 w-4 shrink-0 text-sidebar-muted" aria-hidden="true" />
      </Link>
    </aside>
  );
}