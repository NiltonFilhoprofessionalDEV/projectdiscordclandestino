import { useEffect, type ReactNode } from "react";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-abyss/85 p-4 backdrop-blur-sm sm:items-center">
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
        className="surface-raised relative z-10 w-full max-w-md rounded-[1.6rem] p-6"
      >
        <h2 id={titleId} className="font-display text-xl text-cloud">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-haze">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
