"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl",
    "text-sm font-bold tracking-wide overflow-hidden",
    "transition-all duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "active:scale-[0.94]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          // Gradiente alinhado com o hologram: azul profundo → violeta → roxo
          "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 text-white",
          "shadow-lg shadow-violet-700/40",
          "hover:shadow-xl hover:shadow-violet-700/55 hover:-translate-y-1",
          "hover:from-indigo-500 hover:via-violet-500 hover:to-purple-600",
        ].join(" "),
        destructive: [
          "bg-gradient-to-r from-rose-600 to-red-600 text-white",
          "shadow-lg shadow-rose-600/40",
          "hover:shadow-xl hover:shadow-rose-600/50 hover:-translate-y-1",
          "hover:from-rose-500 hover:to-red-500",
        ].join(" "),
        outline: [
          "border-2 border-violet-400 bg-white/90 text-violet-800",
          "shadow-sm backdrop-blur-sm",
          "hover:border-violet-600 hover:bg-violet-50 hover:text-violet-900 hover:-translate-y-1 hover:shadow-md hover:shadow-violet-300/40",
        ].join(" "),
        secondary: [
          "bg-violet-200 text-violet-900",
          "shadow-sm",
          "hover:bg-violet-300 hover:text-violet-950 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-300/30",
        ].join(" "),
        ghost: [
          "hover:bg-white/50 hover:text-violet-800 hover:backdrop-blur-sm hover:shadow-sm",
        ].join(" "),
        link: "text-violet-700 underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-9 text-base",
        icon: "h-10 w-10 rounded-xl",
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onPointerDown={asChild ? onPointerDown : handleRipple}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
