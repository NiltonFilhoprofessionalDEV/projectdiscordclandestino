import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn("control-select", className)} {...props} />;
  },
);
