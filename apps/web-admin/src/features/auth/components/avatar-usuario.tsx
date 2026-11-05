import { cn } from "@/lib/cn";

interface AvatarUsuarioProps {
  nome: string;
  fotoUrl?: string | null;
  className?: string;
}

/** Foto do usuário ou, sem foto, a inicial do nome num círculo. */
export function AvatarUsuario({ nome, fotoUrl, className }: AvatarUsuarioProps) {
  const base = "shrink-0 rounded-full";

  if (fotoUrl) {
    // URL pública do Storage: sem domínio fixo para o next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fotoUrl} alt="" className={cn(base, "object-cover", className)} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(base, "flex items-center justify-center bg-sidebar-active-bg font-semibold text-sidebar-active-fg", className)}
    >
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}
