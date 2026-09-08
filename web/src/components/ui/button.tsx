import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-electric/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        solid:
          "bg-electric text-white shadow-[0_10px_24px_rgba(93,124,255,0.24)] hover:bg-[#718cff]",
        ghost: "bg-white/5 text-cloud hover:bg-white/9",
        danger: "bg-coral text-white hover:bg-[#ff7487]",
        live:
          "bg-electric/16 text-[#9fb1ff] ring-1 ring-electric/30 hover:bg-electric/22",
        mute: "bg-coral/14 text-[#ff9cab] ring-1 ring-coral/24 hover:bg-coral/20",
      },
      size: {
        md: "h-11 min-w-11 px-4",
        icon: "size-11 p-0",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
