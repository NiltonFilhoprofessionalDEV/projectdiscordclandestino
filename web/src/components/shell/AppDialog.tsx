import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";

type AppDialogProps = {
  open: boolean;
  titleId: string;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function AppDialog({
  open,
  titleId,
  title,
  description,
  onClose,
  children,
}: AppDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/75 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md max-h-[min(90dvh,40rem)] overflow-y-auto rounded-[20px] border border-white/[0.07] bg-panel shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
      >
        <div className="clan-stripe h-0.5 w-full" aria-hidden />
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-display text-xl font-bold text-cloud">
                {title}
              </h2>
              {description ? (
                <p className="mt-1.5 text-sm leading-relaxed text-haze">{description}</p>
              ) : null}
            </div>
            <IconButton
              type="button"
              size="iconSm"
              variant="ghost"
              className="shrink-0"
              aria-label="Fechar"
              onClick={onClose}
            >
              <Icon icon={X} size="action" />
            </IconButton>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
