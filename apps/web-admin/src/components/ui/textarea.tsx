import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const textareaVariants = cva(
  "flex w-full text-foreground bg-card-muted transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y",
  {
    variants: {
      variant: {
        default: "border-2 border-secondary rounded-xl bg-card-muted focus:bg-white",
        outline: "border-2 border-border-muted rounded-xl bg-white focus:bg-white",
        subtle: "border-2 border-border-subtle rounded-xl bg-card-muted focus:bg-white",
      },
      hasError: {
        true: "border-destructive text-destructive placeholder:text-destructive/60 focus-visible:ring-destructive focus-visible:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, hasError, rows = 3, ...props }, ref) => {
    return (
      <textarea
        rows={rows}
        className={cn(textareaVariants({ variant, hasError, className }), "px-3.5 py-2 text-base")}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
