"use client";

import { Home, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVoluntarios } from "../hooks/use-voluntarios";
import { AREA_DE_AJUDA_INFO, STATUS_VOLUNTARIO_INFO, TIPO_VOLUNTARIO_INFO } from "../opcoes";
import type { VoluntarioDetalhe } from "../types";
import { VoluntarioForm } from "./voluntario-form";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="break-words text-foreground">{children}</dd>
    </div>
  );
}

const NAO_INFORMADO = <span className="text-muted-foreground">Não informado</span>;

/** Quando o lar abre: `/admin/lares?lar=<id>` (a tela de lares abre o detalhe a partir desse parâmetro). */
export function hrefDoLar(larId: string): string {
  return `/admin/lares?lar=${encodeURIComponent(larId)}`;
}

interface VoluntarioDetalhesProps {
  voluntario: VoluntarioDetalhe;
  onEditar: VoidFunction;
  onFechar: VoidFunction;
}

/** Dados completos de um voluntário e o lar temporário ligado a ele (link para a tela de lares). */
export function VoluntarioDetalhes({ voluntario, onEditar, onFechar }: VoluntarioDetalhesProps) {
  const status = STATUS_VOLUNTARIO_INFO[voluntario.status];
  const lar = voluntario.larTemporario;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="neutral" size="sm">
          {TIPO_VOLUNTARIO_INFO[voluntario.tipo].rotulo}
        </Badge>
        <Badge variant={status.variante} size="sm">
          {status.rotulo}
        </Badge>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo rotulo="Telefone ou WhatsApp">
          {voluntario.telefone ? (
            <a
              href={`tel:${voluntario.telefone.replace(/\D/g, "")}`}
              className="inline-flex items-center gap-1.5 hover:text-primary hover:underline"
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              {voluntario.telefone}
            </a>
          ) : (
            NAO_INFORMADO
          )}
        </Campo>
        <Campo rotulo="E-mail">
          {voluntario.email ? (
            <a
              href={`mailto:${voluntario.email}`}
              className="inline-flex min-w-0 items-center gap-1.5 hover:text-primary hover:underline"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{voluntario.email}</span>
            </a>
          ) : (
            NAO_INFORMADO
          )}
        </Campo>
        <Campo rotulo="Bairro">{voluntario.bairro || NAO_INFORMADO}</Campo>
        <Campo rotulo="Cadastrado em">
          {voluntario.createdAt ? new Date(voluntario.createdAt).toLocaleDateString("pt-BR") : NAO_INFORMADO}
        </Campo>
      </dl>

      <section aria-label="Como quer ajudar" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como quer ajudar</h3>
        {voluntario.areasDeAjuda.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {voluntario.areasDeAjuda.map((area) => (
              <li key={area}>
                <Badge variant="outline" size="sm">
                  {AREA_DE_AJUDA_INFO[area].rotulo}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma área de ajuda informada.</p>
        )}
      </section>

      <section
        aria-label="Lar temporário"
        className="flex flex-col gap-2 rounded-xl border-2 border-border-subtle bg-card-muted p-3.5"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lar temporário</h3>
        {lar ? (
          <Link
            href={hrefDoLar(lar.id)}
            className="inline-flex w-fit items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
          >
            <Home className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            {lar.enderecoRegiao || "Endereço não informado"}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Este voluntário não tem lar temporário vinculado.</p>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onFechar}>
          Fechar
        </Button>
        <Button type="button" onClick={onEditar}>
          Editar
        </Button>
      </div>
    </div>
  );
}

interface VoluntarioModalProps {
  voluntarioId: string;
  onFechar: VoidFunction;
}

/**
 * Conteúdo do modal que abre ao clicar num voluntário: os detalhes e, ao clicar em "Editar",
 * o mesmo formulário do cadastro com os dados preenchidos. Lê o voluntário da lista (e não de uma
 * cópia), então depois de salvar mostra os dados já atualizados.
 */
export function VoluntarioModal({ voluntarioId, onFechar }: VoluntarioModalProps) {
  const { data: voluntarios } = useVoluntarios();
  const [editando, setEditando] = useState(false);
  // Guarda o último voluntário visto: se ele sair da lista (removido) enquanto o modal fecha, não pisca "não encontrado".
  const ultimoVisto = useRef<VoluntarioDetalhe | null>(null);
  const encontrado = voluntarios?.find((item) => item.id === voluntarioId);
  if (encontrado) ultimoVisto.current = encontrado;
  const voluntario = encontrado ?? ultimoVisto.current;

  if (!voluntario) {
    return (
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Voluntário não encontrado</DialogTitle>
          <DialogDescription>Ele pode ter sido removido. Feche e confira a lista.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onFechar}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editando ? "Editar voluntário" : voluntario.nome}</DialogTitle>
        <DialogDescription>
          {editando ? "Altere o que precisar e salve." : "Dados do voluntário e o lar temporário ligado a ele."}
        </DialogDescription>
      </DialogHeader>
      {editando ? (
        <VoluntarioForm voluntario={voluntario} onFechar={() => setEditando(false)} />
      ) : (
        <VoluntarioDetalhes voluntario={voluntario} onEditar={() => setEditando(true)} onFechar={onFechar} />
      )}
    </>
  );
}
