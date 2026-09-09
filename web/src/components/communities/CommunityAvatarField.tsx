import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { initials } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";

type CommunityAvatarFieldProps = {
  name: string;
  avatarUrl: string | null;
  onFile: (file: File | null) => void;
  label?: string;
};

export function CommunityAvatarField({
  name,
  avatarUrl,
  onFile,
  label = "Ícone da comunidade",
}: CommunityAvatarFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function onPickFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const next = URL.createObjectURL(file);
    setPreviewUrl(next);
    onFile(file);
  }

  function clearPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onFile(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  const shown = previewUrl ?? avatarUrl;

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-deck text-lg font-semibold text-cloud ring-1 ring-haze/20 transition duration-150 ease-out hover:ring-electric/40"
        onClick={() => fileRef.current?.click()}
        aria-label="Escolher ícone da comunidade"
      >
        {shown ? (
          <img src={shown} alt="" className="size-full object-cover" />
        ) : (
          initials(name || "C")
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-abyss/75 py-1 text-[10px] text-cloud">
          <Icon icon={Camera} size="sm" />
          Foto
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-haze">{label}</p>
        <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP ou GIF · até 2 MB</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            Escolher imagem
          </Button>
          {previewUrl ? (
            <Button type="button" variant="ghost" onClick={clearPreview}>
              Remover
            </Button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => onPickFile(event.target.files?.[0])}
        />
      </div>
    </div>
  );
}
