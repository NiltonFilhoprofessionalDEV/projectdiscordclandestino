import type { ReactNode } from "react";
import { cn } from "../../lib/utils.ts";

type TooltipProps = {
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
};

const SIDE_CLASS = {
  top: "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
  bottom: "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
  left: "right-[calc(100%+8px)] top-1/2 -translate-y-1/2",
  right: "left-[calc(100%+8px)] top-1/2 -translate-y-1/2",
} as const;

export function Tooltip({ label, side = "top", children }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-[10px] border border-white/[0.08] bg-[#0A0B11] px-2.5 py-1.5 text-[11px] font-semibold text-cloud opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-opacity duration-150 ease-out group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          SIDE_CLASS[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
