import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-copper/70 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        solid: "bg-copper text-void hover:bg-copper-bright",
        ghost: "bg-white/5 text-fog hover:bg-white/10",
        danger: "bg-rose-500/90 text-white hover:bg-rose-400",
        live: "bg-led/15 text-led shadow-[0_0_18px_rgba(126,224,255,0.25)] hover:bg-led/25",
        mute: "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30",
      },
      size: {
        md: "h-11 min-w-11 px-4",
        icon: "size-12",
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
