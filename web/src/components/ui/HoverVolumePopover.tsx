import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../../lib/utils.ts";

type HoverVolumePopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  panel: ReactNode;
  className?: string;
  panelClassName?: string;
  align?: "center" | "start";
};

/**
 * Popover de volume vertical acima do botão.
 * Fecha na hora ao sair com o ponteiro ou ao clicar fora.
 */
export function HoverVolumePopover({
  open,
  onOpenChange,
  children,
  panel,
  className,
  panelClassName,
  align = "center",
}: HoverVolumePopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative shrink-0", className)}
      onPointerEnter={() => onOpenChange(true)}
      onPointerLeave={() => onOpenChange(false)}
    >
      {children}
      {open ? (
        <div
          className={cn(
            "absolute bottom-full z-[80] flex flex-col items-center pb-1.5",
            align === "center" ? "left-1/2 -translate-x-1/2" : "left-0 items-start",
            panelClassName,
          )}
        >
          <div className="rounded-xl border border-white/[0.1] bg-[#0A0B11]/95 px-2.5 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
            {panel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
