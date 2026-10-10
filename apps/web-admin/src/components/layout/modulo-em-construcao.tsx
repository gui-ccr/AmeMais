import { Construction } from "lucide-react";

interface ModuloEmConstrucaoProps {
  /** Nome do módulo, exibido como título da página. */
  titulo: string;
}

/**
 * Página provisória de um módulo do painel que ainda não foi desenvolvido.
 * Existe para a rota da sidebar abrir uma página de verdade (e não um 404);
 * quando o módulo for implementado, a página troca este componente pela tela real.
 *
 * Usa `<section>` e não `<main>`: o `<main>` já vem do layout do `/admin`.
 */
export function ModuloEmConstrucao({ titulo }: ModuloEmConstrucaoProps) {
  return (
    <section className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="border-b-2 border-secondary pb-6">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">{titulo}</h1>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-card-muted p-10 text-center">
        <Construction className="h-10 w-10 text-muted-dark" aria-hidden="true" />
        <p className="font-display text-3xl font-bold text-foreground">Em construção</p>
        <p className="max-w-sm text-muted-foreground">Este módulo ainda está sendo desenvolvido e estará disponível em breve.</p>
      </div>
    </section>
  );
}
