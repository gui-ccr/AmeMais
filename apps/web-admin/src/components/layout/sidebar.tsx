"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navigation = [
  { name: "Animais", href: "/admin/animais", icon: "🐾" },
  { name: "Lares", href: "/admin/lares", icon: "🏠" },
  { name: "Eventos", href: "/admin/eventos", icon: "📅" },
  { name: "Urgências", href: "/admin/urgencias", icon: "🚨" },
  { name: "Interesses", href: "/admin/interesses", icon: "❤️" },
  { name: "Usuários", href: "/admin/usuarios", icon: "👥" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex flex-col bg-sidebar-bg text-sidebar-fg border-r border-sidebar-border h-full min-h-screen">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-sidebar-border">
        <span className="text-xl font-bold font-display text-primary-light">AmeMais Admin</span>
      </div>
      <nav className="flex flex-1 flex-col p-4 gap-2">
        <ul className="flex flex-1 flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 transition-colors",
                    isActive
                      ? "bg-sidebar-active-bg text-sidebar-active-fg"
                      : "text-sidebar-muted hover:bg-secondary-hover hover:text-sidebar-fg"
                  )}
                >
                  <span className="h-5 w-5 shrink-0 flex items-center justify-center text-lg">
                    {item.icon}
                  </span>
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
