import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 hover:-translate-y-0.5 hover:from-violet-500 hover:to-fuchsia-400",
        destructive:
          "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 hover:-translate-y-0.5",
        outline:
          "border border-violet-200 bg-white/70 text-foreground shadow-sm backdrop-blur-sm hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-violet-100",
        ghost: "hover:bg-violet-100/70 hover:text-violet-700",
        link: "text-violet-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
