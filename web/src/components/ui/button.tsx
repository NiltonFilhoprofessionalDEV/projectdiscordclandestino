import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold tracking-wide outline-none transition-[background-color,border-color,box-shadow,color,filter,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-electric/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,#7c3aed_0%,#ec4899_100%)] text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:brightness-110 hover:shadow-[0_10px_28px_rgba(124,58,237,0.38)]",
        solid:
          "bg-[linear-gradient(135deg,#7c3aed_0%,#ec4899_100%)] text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] hover:brightness-110 hover:shadow-[0_10px_28px_rgba(124,58,237,0.38)]",
        secondary:
          "border border-white/[0.06] bg-white/[0.04] text-cloud hover:border-[rgba(124,58,237,0.30)] hover:bg-[rgba(124,58,237,0.12)]",
        ghost:
          "bg-transparent text-haze hover:bg-white/[0.06] hover:text-cloud active:bg-[rgba(124,58,237,0.15)]",
        danger:
          "bg-[#9D174D] text-white shadow-[0_8px_24px_rgba(157,23,77,0.22)] hover:bg-[#BE185D]",
        live: "bg-[rgba(124,58,237,0.20)] text-[#A78BFA] ring-1 ring-electric/35 hover:bg-electric/25",
        mute: "bg-coral/20 text-coral ring-1 ring-coral/40 hover:bg-coral/30",
        send: "bg-[linear-gradient(135deg,#7c3aed_0%,#ec4899_100%)] text-white shadow-[0_8px_24px_rgba(124,58,237,0.32)] hover:brightness-110 hover:shadow-[0_0_22px_rgba(124,58,237,0.35)]",
      },
      size: {
        sm: "h-10 min-h-10 rounded-[10px] px-3 text-sm",
        md: "h-11 min-h-11 rounded-xl px-4 text-sm",
        lg: "h-12 min-h-12 rounded-xl px-6 text-sm",
        icon: "size-11 min-h-11 min-w-11 rounded-xl p-0",
        iconSm: "size-10 min-h-10 min-w-10 rounded-xl p-0",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, ...props },
  ref,
) {
  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(function IconButton(
  { size = "icon", ...props },
  ref,
) {
  return <Button ref={ref} size={size} {...props} />;
});

export { buttonVariants };
