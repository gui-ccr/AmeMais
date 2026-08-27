import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const inputVariants = cva(
  "flex w-full text-foreground bg-card-muted transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  {
    variants: {
      variant: {
        default: "border-2 border-secondary rounded-xl bg-card-muted focus:bg-white",
        outline: "border-2 border-border-muted rounded-xl bg-white focus:bg-white",
        subtle: "border-2 border-border-subtle rounded-xl bg-card-muted focus:bg-white",
        pill: "border-2 border-secondary rounded-full bg-white px-4 focus:bg-white",
      },
      inputSize: {
        default: "h-11 px-3.5 py-2 text-base",
        sm: "h-9 px-3 py-1.5 text-sm rounded-lg",
        lg: "h-13 px-4 py-3 text-lg rounded-2xl",
      },
      hasError: {
        true: "border-destructive text-destructive placeholder:text-destructive/60 focus-visible:ring-destructive focus-visible:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, hasError, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, hasError, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
