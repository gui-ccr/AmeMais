import { Badge } from "@/components/ui/badge";
import { getStatusEvento } from "../status";
import type { EventDTO } from "../types";

interface EventoStatusBadgeProps {
  evento: Pick<EventDTO, "isActive"> & { dataEvento?: string | null };
}

export function EventoStatusBadge({ evento }: EventoStatusBadgeProps) {
  const status = getStatusEvento(evento);

  return (
    <Badge variant={status.variante} size="sm" dot title={status.descricao}>
      {status.rotulo}
    </Badge>
  );
}
