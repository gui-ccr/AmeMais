import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-1 font-display text-5xl font-bold leading-none md:text-6xl">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-lg text-muted-dark md:text-xl">{description}</p>
      ) : null}
    </div>
  );
}
