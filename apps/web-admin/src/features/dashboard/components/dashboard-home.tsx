"use client";

import { AlertTriangle, ArrowRight, Calendar, Dog, Home, HeartHandshake, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STATUS_INFO } from "@/features/animais/opcoes";
import { STATUS_ANIMAL } from "@/features/animais/types";
import { mensagemDeErroDaApi } from "@/lib/api-error";
import { useDashboard } from "../hooks/use-dashboard";
import type { Dashboard, EventoProximo } from "../types";

const FORMATO_DATA = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function plural(quantidade: number, singular: string, pluralDaPalavra: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : pluralDaPalavra}`;
}

interface CartaoDeNumeroProps {
  titulo: string;
  numero: number;
  detalhe: ReactNode;
  icone: LucideIcon;
  href: string;
  /** Destaca o cartão (ex.: há urgência aberta) sem depender só da cor: o detalhe também diz o motivo. */
  alerta?: boolean;
}

/** Um número grande, o que ele significa e o atalho para a tela do módulo. */
function CartaoDeNumero({ titulo, numero, detalhe, icone: Icone, href, alerta }: CartaoDeNumeroProps) {
  return (
    <Link
      href={href}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Card className="flex h-full flex-col gap-3 p-5 transition-shadow group-hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-muted-foreground">{titulo}</h2>
          <Icone className={alerta ? "h-5 w-5 text-primary" : "h-5 w-5 text-secondary"} aria-hidden="true" />
        </div>
        <p className="font-display text-5xl font-bold leading-none text-foreground">{numero}</p>
        <div className="mt-auto flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="min-w-0">{detalhe}</span>
          <ArrowRight
            className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Card>
    </Link>
  );
}

function AnimaisPorStatus({ animais }: { animais: NonNullable<Dashboard["animais"]> }) {
  return (
    <Card className="flex flex-col gap-4 p-5 md:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-muted-foreground">Animais por situação</h2>
        <Dog className="h-5 w-5 text-secondary" aria-hidden="true" />
      </div>
      <p className="font-display text-5xl font-bold leading-none text-foreground">
        {animais.total}
        <span className="ml-2 text-base font-normal text-muted-foreground">
          {animais.total === 1 ? "animal cadastrado" : "animais cadastrados"}
        </span>
      </p>
      {animais.total > 0 && (
        <div
          className="flex h-2 w-full overflow-hidden rounded-full bg-card-muted"
          role="img"
          aria-label={STATUS_ANIMAL.map((s) => `${STATUS_INFO[s].rotulo}: ${animais.porStatus[s]}`).join(", ")}
        >
          {STATUS_ANIMAL.map((status) => (
            <span
              key={status}
              style={{ width: `${(animais.porStatus[status] / animais.total) * 100}%` }}
              className={BARRA_POR_STATUS[status]}
            />
          ))}
        </div>
      )}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATUS_ANIMAL.map((status) => (
          <li key={status} className="flex flex-col gap-1 rounded-lg bg-card-muted p-3">
            <span className="font-display text-2xl font-bold text-foreground">{animais.porStatus[status]}</span>
            <Badge variant={STATUS_INFO[status].variante} size="sm" className="w-fit">
              {STATUS_INFO[status].rotulo}
            </Badge>
          </li>
        ))}
      </ul>
      <Link href="/admin/animais" className="flex w-fit items-center gap-1 text-sm font-semibold text-secondary hover:underline">
        Ver todos os animais <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

const BARRA_POR_STATUS: Record<(typeof STATUS_ANIMAL)[number], string> = {
  disponivel: "bg-status-success-fg",
  em_tratamento: "bg-status-warning-fg",
  em_lar_temporario: "bg-secondary",
  adotado: "bg-brand-border-muted",
};

function ProximosEventos({ eventos }: { eventos: NonNullable<Dashboard["eventos"]> }) {
  return (
    <Card className="flex flex-col gap-4 p-5 md:col-span-2 xl:col-span-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-muted-foreground">Próximos eventos</h2>
        <Calendar className="h-5 w-5 text-secondary" aria-hidden="true" />
      </div>
      {eventos.proximos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento marcado para os próximos dias.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {eventos.proximos.map((evento) => (
            <EventoItem key={evento.id} evento={evento} />
          ))}
        </ul>
      )}
      <Link href="/admin/eventos" className="mt-auto flex w-fit items-center gap-1 text-sm font-semibold text-secondary hover:underline">
        {eventos.total > eventos.proximos.length
          ? `Ver os ${eventos.total} eventos`
          : "Ver eventos e urgências"}{" "}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

function EventoItem({ evento }: { evento: EventoProximo }) {
  const data = new Date(evento.dataEvento);
  return (
    <li className="flex flex-col gap-0.5 border-l-2 border-secondary pl-3">
      <span className="truncate text-sm font-semibold text-foreground">{evento.titulo}</span>
      <time dateTime={evento.dataEvento} className="text-xs capitalize text-muted-foreground">
        {FORMATO_DATA.format(data)}
      </time>
    </li>
  );
}

function SkeletonDaHome() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando números">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="flex h-36 animate-pulse flex-col gap-3 p-5" aria-hidden="true">
          <div className="h-4 w-1/2 rounded bg-card-muted" />
          <div className="h-10 w-1/4 rounded bg-card-muted" />
          <div className="mt-auto h-3 w-2/3 rounded bg-card-muted" />
        </Card>
      ))}
    </div>
  );
}

/** Os números operacionais da home. Só aparecem os blocos dos módulos que a pessoa pode acessar. */
export function DashboardHome() {
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();

  if (isPending) return <SkeletonDaHome />;

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 text-center"
      >
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-medium text-destructive">
          {mensagemDeErroDaApi(error, "Não foi possível carregar os números do painel. Tente novamente.")}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Tentando..." : "Tentar novamente"}
        </Button>
      </div>
    );
  }

  const { animais, lares, urgencias, voluntarios, eventos } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {animais && <AnimaisPorStatus animais={animais} />}

      {urgencias && (
        <CartaoDeNumero
          titulo="Urgências abertas"
          numero={urgencias.abertas}
          icone={AlertTriangle}
          href="/admin/urgencias"
          alerta={urgencias.urgentes > 0}
          detalhe={
            urgencias.urgentes > 0 ? (
              <Badge variant="urgent" size="sm">
                {plural(urgencias.urgentes, "urgente", "urgentes")}
              </Badge>
            ) : (
              "Nenhuma com prioridade urgente"
            )
          }
        />
      )}

      {lares && (
        <CartaoDeNumero
          titulo="Vagas livres em lares"
          numero={lares.vagasLivres}
          icone={Home}
          href="/admin/lares"
          detalhe={`em ${plural(lares.disponiveis, "lar disponível", "lares disponíveis")}`}
        />
      )}

      {voluntarios && (
        <CartaoDeNumero
          titulo="Voluntários ativos"
          numero={voluntarios.ativos}
          icone={HeartHandshake}
          href="/admin/voluntarios"
          detalhe={`de ${plural(voluntarios.total, "voluntário cadastrado", "voluntários cadastrados")}`}
        />
      )}

      {eventos && <ProximosEventos eventos={eventos} />}
    </div>
  );
}
