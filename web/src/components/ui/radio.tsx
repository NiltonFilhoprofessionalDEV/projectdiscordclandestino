import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export const Radio = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Radio({ className, ...props }, ref) {
    return <input ref={ref} type="radio" className={cn("control-radio", className)} {...props} />;
  },
);
