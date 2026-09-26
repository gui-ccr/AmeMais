"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { TAMANHO_MAXIMO_FOTO_MB, TIPOS_FOTO_ACEITOS } from "../opcoes";

interface FotoDropzoneProps {
  id: string;
  value: File | null;
  onChange: (arquivo: File | null) => void;
  hasError?: boolean;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Campo de foto: arrastar e soltar ou clicar para escolher. A validação de
 * tipo/tamanho é feita pelo schema do formulário (que mostra a mensagem);
 * aqui só se recebe o arquivo e se mostra a pré-visualização.
 *
 * O `<input type="file">` fica dentro de um `<label>` (visualmente escondido,
 * mas focável): Enter/Espaço abrem o seletor pelo teclado e o foco aparece no
 * quadro pontilhado.
 */
export function FotoDropzone({ id, value, onChange, hasError }: FotoDropzoneProps) {
  const [arrastando, setArrastando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !value.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function receber(arquivos: FileList | null) {
    const arquivo = arquivos?.[0];
    if (arquivo) onChange(arquivo);
  }

  function aoSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastando(false);
    receber(evento.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
          arrastando
            ? "border-primary bg-accent"
            : hasError
              ? "border-destructive bg-destructive/5"
              : "border-border-muted bg-card-muted hover:border-primary",
        )}
      >
        <ImagePlus className="h-8 w-8 text-muted-dark" aria-hidden="true" />
        <span className="font-medium text-foreground">
          Arraste a foto aqui ou <span className="text-primary underline">escolha no computador</span>
        </span>
        <span className="text-xs text-muted-foreground">
          JPG, PNG ou WebP · até {TAMANHO_MAXIMO_FOTO_MB} MB
        </span>
        <input
          id={id}
          type="file"
          accept={TIPOS_FOTO_ACEITOS.join(",")}
          className="sr-only"
          onChange={(evento) => {
            receber(evento.target.files);
            // Permite escolher de novo o mesmo arquivo depois de removê-lo.
            evento.target.value = "";
          }}
        />
      </label>

      {value && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-border-subtle bg-white p-2.5">
          {previewUrl ? (
            // Pré-visualização de um arquivo local (blob:): o next/image não otimiza esse tipo de URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Pré-visualização da foto escolhida" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-card-muted">
              <ImagePlus className="h-6 w-6 text-muted-dark" aria-hidden="true" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{value.name}</span>
            <span className="text-xs text-muted-foreground">{formatarTamanho(value.size)}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
