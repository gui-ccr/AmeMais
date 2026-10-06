import { Notice } from "@/components/ui/notice";

/** Aviso no lugar da lista de urgências (nenhuma ativa, ou API fora do ar). */
export function UrgenciesNotice({ unavailable }: { unavailable: boolean }) {
  if (unavailable) {
    return (
      <Notice title="Não conseguimos carregar as urgências agora" whatsappMessage="Oi! Queria saber do que vocês estão precisando 🐾">
        Tente de novo em alguns minutos, ou fale com a gente pelo WhatsApp que contamos do que estamos precisando.
      </Notice>
    );
  }
  return (
    <Notice emoji="🎉" title="Nenhuma urgência no momento" whatsappMessage="Oi! Queria saber como posso ajudar a AmeMais 🐾">
      Estamos com tudo em dia por enquanto. Mesmo assim, toda ajuda faz diferença: use o PIX acima ou fale com a gente.
    </Notice>
  );
}

/** Aviso no lugar da lista de pontos de coleta (nenhum cadastrado, ou API fora do ar). */
export function CollectionPointsNotice({ unavailable }: { unavailable: boolean }) {
  return (
    <Notice
      title={unavailable ? "Não conseguimos carregar os pontos de coleta" : "Pontos de coleta em atualização"}
      whatsappMessage="Oi! Queria doar ração, cobertores ou remédios. Onde posso deixar? 🐾"
    >
      Para doar ração, cobertores e remédios, fale com a gente pelo WhatsApp que combinamos onde e quando entregar.
    </Notice>
  );
}
