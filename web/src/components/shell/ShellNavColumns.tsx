import type { ReactNode } from "react";
import { cn } from "../../lib/utils.ts";

type ShellNavColumnsProps = {
  open: boolean;
  onClose: () => void;
  rail: ReactNode;
  sidebar: ReactNode;
};

export function ShellNavColumns({ open, onClose, rail, sidebar }: ShellNavColumnsProps) {
  return (
    <div className={cn(open ? "fixed inset-0 z-40 flex pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:contents md:p-0" : "hidden md:contents")}>
      {rail}
      {sidebar}
      {open ? (
        <button
          type="button"
          className="flex-1 bg-abyss/80 backdrop-blur-sm md:hidden"
          aria-label="Fechar menu"
          onClick={onClose}
        />
      ) : null}
    </div>
  );
}
