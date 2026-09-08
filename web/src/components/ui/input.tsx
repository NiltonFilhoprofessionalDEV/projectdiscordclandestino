import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-white/12 bg-void/70 px-4 text-fog outline-none placeholder:text-mist focus:border-copper/70 focus:ring-2 focus:ring-copper/25",
        className,
      )}
      {...props}
    />
  );
}
