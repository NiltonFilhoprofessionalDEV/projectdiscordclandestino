import { Mic, MicOff, MonitorUp, PhoneOff } from "lucide-react";
import type { Root } from "react-dom/client";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";

export type FloatingCallBarProps = {
  micOn: boolean;
  screenOn: boolean;
  canScreenShare: boolean;
  onToggleMic: () => void;
  onToggleScreen: () => void;
  onLeave: () => void;
};

export function renderFloatingCallBar(root: Root, props: FloatingCallBarProps): void {
  root.render(<FloatingCallBar {...props} />);
}

export function FloatingCallBar({
  micOn,
  screenOn,
  canScreenShare,
  onToggleMic,
  onToggleScreen,
  onLeave,
}: FloatingCallBarProps) {
  const micLabel = micOn ? "Mutar microfone" : "Desmutar microfone";
  const screenLabel = screenOn ? "Parar transmissão" : "Compartilhar tela";

  return (
    <div className="flex h-full items-center justify-center gap-2 bg-[#0A0B11] px-3">
      <IconButton
        type="button"
        variant={micOn ? "live" : "mute"}
        onClick={onToggleMic}
        aria-label={micLabel}
        title={micLabel}
      >
        <Icon icon={micOn ? Mic : MicOff} />
      </IconButton>
      {canScreenShare ? (
        <IconButton
          type="button"
          variant={screenOn ? "live" : "secondary"}
          onClick={onToggleScreen}
          aria-label={screenLabel}
          title={screenLabel}
        >
          <Icon icon={MonitorUp} />
        </IconButton>
      ) : null}
      <IconButton
        type="button"
        variant="danger"
        onClick={onLeave}
        aria-label="Sair da chamada"
        title="Sair da chamada"
      >
        <Icon icon={PhoneOff} />
      </IconButton>
    </div>
  );
}
