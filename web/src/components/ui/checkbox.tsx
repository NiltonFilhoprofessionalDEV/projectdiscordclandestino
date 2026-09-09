import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ className, ...props }, ref) {
    return <input ref={ref} type="checkbox" className={cn("control-check", className)} {...props} />;
  },
);
