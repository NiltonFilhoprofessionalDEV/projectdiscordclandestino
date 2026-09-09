import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-xl border border-white/[0.08] bg-ink px-4 text-base text-cloud outline-none placeholder:text-muted transition duration-150 ease-out focus:border-electric/60 focus:ring-2 focus:ring-electric/20",
          className,
        )}
        {...props}
      />
    );
  },
);
