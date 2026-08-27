import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const selectVariants = cva(
  "flex w-full appearance-none text-foreground bg-card-muted transition-colors pr-10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-2 border-secondary rounded-xl bg-card-muted focus:bg-white",
        outline: "border-2 border-border-muted rounded-xl bg-white focus:bg-white",
        subtle: "border-2 border-border-subtle rounded-xl bg-card-muted focus:bg-white",
        pill: "border-2 border-secondary rounded-full bg-white px-4 focus:bg-white",
      },
      selectSize: {
        default: "h-11 px-3.5 py-2 text-base",
        sm: "h-9 px-3 py-1.5 text-sm rounded-lg",
        lg: "h-13 px-4 py-3 text-lg rounded-2xl",
      },
      hasError: {
        true: "border-destructive text-destructive focus-visible:ring-destructive focus-visible:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
      selectSize: "default",
    },
  },
);

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, variant, selectSize, hasError, children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", containerClassName)}>
        <select
          ref={ref}
          className={cn(selectVariants({ variant, selectSize, hasError, className }))}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-dark">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";
