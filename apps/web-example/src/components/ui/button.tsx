import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-base font-medium transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover border-2 border-primary",
        secondary: "bg-secondary text-white hover:bg-primary border-2 border-secondary",
        outline: "border-2 border-border text-foreground hover:bg-secondary hover:text-white bg-white",
        ghost: "hover:bg-muted text-foreground",
        destructive: "bg-destructive text-white hover:bg-primary-hover",
        chip: "bg-white text-secondary border-2 border-border-muted hover:border-primary",
        "chip-active": "bg-secondary text-white border-2 border-secondary",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";

