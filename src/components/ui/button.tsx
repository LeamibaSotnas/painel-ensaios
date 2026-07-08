import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl",
    "text-sm font-semibold tracking-wide overflow-hidden",
    "transition-all duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "active:scale-[0.96]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white",
          "shadow-md shadow-violet-500/30",
          "hover:shadow-lg hover:shadow-violet-500/40 hover:-translate-y-0.5",
          "hover:from-violet-500 hover:to-fuchsia-400",
        ].join(" "),
        destructive: [
          "bg-gradient-to-r from-rose-600 to-red-500 text-white",
          "shadow-md shadow-rose-500/30",
          "hover:shadow-lg hover:shadow-rose-500/40 hover:-translate-y-0.5",
        ].join(" "),
        outline: [
          "border border-violet-200 bg-white/80 text-foreground",
          "shadow-sm backdrop-blur-sm",
          "hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-100",
        ].join(" "),
        secondary: [
          "bg-violet-100 text-violet-800",
          "shadow-sm",
          "hover:bg-violet-200 hover:-translate-y-0.5",
        ].join(" "),
        ghost: [
          "hover:bg-violet-100/70 hover:text-violet-700",
        ].join(" "),
        link: "text-violet-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
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
  ({ className, variant, size, asChild = false, onPointerDown, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Efeito ripple via CSS puro — adiciona um elemento temporário animado
    function handleRipple(e: React.PointerEvent<HTMLButtonElement>) {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position:absolute;
        border-radius:50%;
        pointer-events:none;
        width:${size}px;
        height:${size}px;
        left:${x}px;
        top:${y}px;
        background:rgba(255,255,255,0.25);
        transform:scale(0);
        animation:btn-ripple 500ms ease-out forwards;
      `;
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });

      onPointerDown?.(e);
    }

    return (
      <>
        <style>{`
          @keyframes btn-ripple {
            to { transform: scale(1); opacity: 0; }
          }
        `}</style>
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onPointerDown={asChild ? onPointerDown : handleRipple}
          {...props}
        />
      </>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
