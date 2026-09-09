import { useEffect, useState } from "react";
import { Button } from "../ui/button.tsx";
import { Checkbox } from "../ui/checkbox.tsx";
import { Radio } from "../ui/radio.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";
import type { ScreenShareConfig, ScreenShareQuality, ScreenShareSurface } from "../../voice/screenShare.ts";

type ScreenShareSettingsProps = {
  open: boolean;
  config: ScreenShareConfig;
  onClose: () => void;
  onChangeWindow: (config: ScreenShareConfig) => Promise<void> | void;
  onStop: () => Promise<void> | void;
};

const SURFACES: Array<{ value: ScreenShareSurface; label: string; hint: string }> = [
  { value: "monitor", label: "Tela inteira", hint: "Todo o monitor" },
  { value: "window", label: "Janela", hint: "Um aplicativo" },
  { value: "browser", label: "Aba", hint: "Uma aba do navegador" },
];

const QUALITIES: Array<{ value: ScreenShareQuality; label: string; hint: string }> = [
  { value: "detail", label: "Detalhe", hint: "Texto, slides e código" },
  { value: "motion", label: "Movimento", hint: "Jogo e vídeo" },
];

export function ScreenShareSettings({
  open,
  config,
  onClose,
  onChangeWindow,
  onStop,
}: ScreenShareSettingsProps) {
  const [draft, setDraft] = useState(config);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(config);
      setPending(false);
    }
  }, [open, config]);

  async function changeWindow() {
    setPending(true);
    try {
      await onChangeWindow(draft);
    } finally {
      setPending(false);
    }
  }

  async function stopShare() {
    setPending(true);
    try {
      await onStop();
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <AppDialog
      open={open}
      titleId="screen-share-settings-title"
      title="Transmissão"
      description="Troque a janela ou o tipo. A transmissão só encerra por aqui."
      onClose={onClose}
    >
      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-haze">Tipo</legend>
        <div className="mt-3 space-y-2">
          {SURFACES.map((surface) => (
            <label key={surface.value} className="flex min-h-11 items-center gap-3 text-sm text-cloud">
              <Radio
                name="screen-share-surface"
                checked={draft.surface === surface.value}
                onChange={() => setDraft({ ...draft, surface: surface.value })}
              />
              <span>
                {surface.label}
                <span className="ml-2 text-haze">{surface.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-haze">Qualidade</legend>
        <div className="mt-3 space-y-2">
          {QUALITIES.map((quality) => (
            <label key={quality.value} className="flex min-h-11 items-center gap-3 text-sm text-cloud">
              <Radio
                name="screen-share-quality"
                checked={draft.quality === quality.value}
                onChange={() => setDraft({ ...draft, quality: quality.value })}
              />
              <span>
                {quality.label}
                <span className="ml-2 text-haze">{quality.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-cloud">
        <Checkbox
          checked={draft.audio}
          onChange={(event) => setDraft({ ...draft, audio: event.currentTarget.checked })}
        />
        Incluir áudio da transmissão
      </label>
      <div className="mt-6 flex flex-col gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={() => void changeWindow()}
        >
          Trocar janela
        </Button>
        <Button type="button" variant="danger" disabled={pending} onClick={() => void stopShare()}>
          Encerrar transmissão
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
          Continuar transmitindo
        </Button>
      </div>
    </AppDialog>
  );
}
