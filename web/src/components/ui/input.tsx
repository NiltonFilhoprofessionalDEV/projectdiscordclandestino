import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-white/10 bg-void px-4 text-fog outline-none placeholder:text-mist focus:border-copper/60 focus:ring-2 focus:ring-copper/30",
        className,
      )}
      {...props}
    />
  );
}
