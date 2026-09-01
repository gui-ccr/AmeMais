import Image from "next/image";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Action } from "../types";

export function ActionCard({ action }: { action: Action }) {
  return (
    <div data-reveal-item className="flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-white">
      <div className="relative h-42.5 w-full border-b-2 border-border">
        <Image
          src={action.photo}
          alt={action.title}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <b className="text-xl leading-tight">{action.title}</b>
        <p className="flex-1 text-lg leading-snug text-muted-dark">{action.description}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            size="sm"
            className="gap-1 border-brand-border-muted bg-transparent text-muted-dark"
          >
            <MapPin className="size-3.5" /> {action.location}
          </Badge>
          <Badge variant="outline" size="sm" className="border-brand-border-muted bg-transparent text-muted-dark">
            {action.date}
          </Badge>
        </div>
      </div>
    </div>
  );
}
