import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const cardVariants = cva("rounded-xl bg-white p-4", {
  variants: {
    variant: {
      default: "border-2 border-border-subtle",
      outline: "border-2 border-border-muted",
      subtle: "border-2 border-border-subtle bg-card-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
));
Card.displayName = "Card";
