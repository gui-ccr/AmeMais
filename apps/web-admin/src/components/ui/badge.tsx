import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        // Status da ONG
        default: "bg-status-neutral-bg text-status-neutral-fg border border-border-subtle",
        neutral: "bg-status-neutral-bg text-status-neutral-fg border border-border-subtle",
        success: "bg-status-success-bg text-status-success-fg border border-transparent",
        adocao: "bg-status-success-bg text-status-success-fg border border-transparent",
        warning: "bg-status-warning-bg text-status-warning-fg border border-transparent",
        tratamento: "bg-status-warning-bg text-status-warning-fg border border-transparent",
        urgent: "bg-status-urgent-bg text-status-urgent-fg border border-primary-border",
        resgatado: "bg-status-urgent-bg text-status-urgent-fg border border-primary-border",
        destructive: "bg-destructive text-destructive-foreground",
        // Variantes de marca
        primary: "bg-primary text-white border-2 border-primary",
        secondary: "bg-secondary text-white border-2 border-secondary",
        outline: "border-2 border-border text-foreground bg-white",
        muted: "bg-muted text-muted-foreground border border-border-light",
      },
      size: {
        default: "px-3 py-0.5 text-base rounded-full",
        sm: "px-2.5 py-0.5 text-xs font-semibold rounded-full",
        lg: "px-4 py-1 text-lg rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const dotColors: Record<string, string> = {
  default: "bg-status-neutral-fg",
  neutral: "bg-status-neutral-fg",
  success: "bg-status-success-fg",
  adocao: "bg-status-success-fg",
  warning: "bg-status-warning-fg",
  tratamento: "bg-status-warning-fg",
  urgent: "bg-status-urgent-fg",
  resgatado: "bg-status-urgent-fg",
  destructive: "bg-white",
  primary: "bg-white",
  secondary: "bg-primary-light",
  outline: "bg-foreground",
  muted: "bg-muted-foreground",
};

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size, dot, children, ...props }, ref) => {
    const variantKey = variant ?? "default";
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props}>
        {dot && (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              dotColors[variantKey] || "bg-current",
            )}
          />
        )}
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";
