import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const labelVariants = cva(
  "text-base font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none inline-flex items-center gap-1",
  {
    variants: {
      size: {
        default: "text-base",
        sm: "text-sm",
        lg: "text-lg font-semibold",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface LabelProps
  extends LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, required, children, ...props }, ref) => (
    <label ref={ref} className={cn(labelVariants({ size, className }))} {...props}>
      {children}
      {required && <span className="text-destructive font-bold ml-0.5">*</span>}
    </label>
  ),
);
Label.displayName = "Label";
