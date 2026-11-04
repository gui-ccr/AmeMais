import { PawPrint } from "lucide-react";
import Image from "next/image";

const DESTAQUES = [
  "Animais resgatados, status e adoções",
  "Rede de lares temporários e voluntários",
  "Doações, urgências da semana e eventos",
] as const;

/** Logo + nome, igual ao topo da barra lateral do painel. */
function Marca({ claro }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo-amemais.jpg"
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
        priority
      />
      <div className="flex flex-col">
        <span className={`font-display text-3xl font-bold leading-none ${claro ? "text-primary-light" : "text-primary"}`}>
          AmeMais
        </span>
        <span className={`text-sm ${claro ? "text-sidebar-muted" : "text-muted-foreground"}`}>Painel interno</span>
      </div>
    </div>
  );
}

interface TelaDeAcessoProps {
  titulo: string;
  descricao: string;
  /** O formulário (login, recuperar senha…). */
  children: React.ReactNode;
  /** Links abaixo do formulário. */
  rodape?: React.ReactNode;
}

/**
 * Layout das telas de acesso ao painel: à esquerda, um painel com a marca e o que o painel
 * faz (some no celular, onde fica só a logo no topo); à direita, o título e o formulário.
 * Só apresentação — a lógica de cada tela fica no formulário que ela passa como `children`.
 */
export function TelaDeAcesso({ titulo, descricao, children, rodape }: TelaDeAcessoProps) {
  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <aside
        aria-label="Sobre o painel AmeMais"
        className="relative hidden w-[45%] max-w-2xl shrink-0 flex-col justify-between overflow-hidden bg-sidebar-bg p-12 text-sidebar-fg lg:flex"
      >
        {/* Enfeites: patinhas e círculos no lugar das linhas de quadra da referência. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-2 border-sidebar-border" />
          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full border-2 border-sidebar-border" />
          <div className="absolute bottom-16 right-28 h-40 w-40 rounded-full border-2 border-sidebar-border" />
          <PawPrint className="absolute right-12 top-16 h-24 w-24 rotate-12 text-sidebar-border" />
          <PawPrint className="absolute right-40 top-44 h-12 w-12 -rotate-12 text-sidebar-border" />
          <PawPrint className="absolute bottom-24 left-1/3 h-16 w-16 rotate-[25deg] text-sidebar-border" />
        </div>

        <div className="relative">
          <Marca claro />
        </div>

        <div className="relative flex max-w-md flex-col gap-5">
          <h2 className="font-display text-6xl font-bold leading-[0.95] text-sidebar-fg">
            Cuidando de quem <span className="text-brand-terracotta-subtle">cuida dos animais.</span>
          </h2>
          <p className="text-lg text-sidebar-muted">
            Tudo o que a ONG precisa no dia a dia, num lugar só, para a equipe e os voluntários.
          </p>
          <ul className="flex flex-col gap-2 text-sidebar-muted">
            {DESTAQUES.map((destaque) => (
              <li key={destaque} className="flex items-center gap-2.5">
                <PawPrint className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {destaque}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-sidebar-muted">ONG AmeMais · Teófilo Otoni – MG</p>
      </aside>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="lg:hidden">
            <Marca />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-5xl font-bold leading-none text-foreground">{titulo}</h1>
            <p className="text-muted-dark">{descricao}</p>
          </div>

          <div className="rounded-2xl border-2 border-border-subtle bg-card p-6 shadow-sm">{children}</div>

          {rodape && <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-dark">{rodape}</div>}
        </div>
      </section>
    </main>
  );
}
