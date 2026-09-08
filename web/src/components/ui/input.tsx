import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-xl border border-haze/15 bg-abyss px-4 text-cloud outline-none placeholder:text-haze/70 focus:border-electric/70 focus:ring-2 focus:ring-electric/25",
          className,
        )}
        {...props}
      />
    );
  },
);
