import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-[1.5px] px-3 py-0.5 text-sm font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border-subtle bg-muted text-foreground",
        urgent: "border-status-urgent-fg bg-status-urgent-bg text-status-urgent-fg",
        warning: "border-status-warning-fg bg-status-warning-bg text-status-warning-fg",
        success: "border-status-success-fg bg-status-success-bg text-status-success-fg",
        neutral: "border-status-neutral-fg bg-status-neutral-bg text-status-neutral-fg",
        outline: "border-2 border-border bg-white text-foreground",
        primary: "border-primary bg-primary text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  },
);
Badge.displayName = "Badge";
