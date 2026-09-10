import { useEffect } from "react";
import { X } from "lucide-react";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";

type ImageLightboxProps = {
  src: string | null;
  alt: string;
  onClose: () => void;
};

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, src]);

  if (!src) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-abyss/90 p-4 backdrop-blur-md">
      <button type="button" className="absolute inset-0 cursor-zoom-out" aria-label="Fechar" onClick={onClose} />
      <IconButton
        type="button"
        size="iconSm"
        variant="secondary"
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-10"
        aria-label="Fechar imagem"
        onClick={onClose}
      >
        <Icon icon={X} size="action" />
      </IconButton>
      <img
        src={src}
        alt={alt}
        className="relative z-10 max-h-[min(92dvh,56rem)] max-w-[min(96vw,56rem)] rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      />
    </div>
  );
}
