import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Settings,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "../ui/button.tsx";

type ControlBarProps = {
  micOn: boolean;
  cameraOn: boolean;
  screenOn: boolean;
  canScreenShare: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreen: () => void;
  onSettings: () => void;
  onLeave: () => void;
};

export function ControlBar({
  micOn,
  cameraOn,
  screenOn,
  canScreenShare,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onSettings,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="glass mx-auto mt-2 flex w-fit flex-wrap items-center justify-center gap-2 rounded-full px-3 py-2 shadow-glow">
      <Button
        type="button"
        size="icon"
        variant={micOn ? "live" : "mute"}
        onClick={onToggleMic}
        aria-label={micOn ? "Desligar microfone" : "Ligar microfone"}
        title={micOn ? "Microfone ligado" : "Microfone desligado"}
      >
        {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant={cameraOn ? "live" : "ghost"}
        onClick={onToggleCamera}
        aria-label={cameraOn ? "Desligar câmera" : "Ligar câmera"}
        title="Câmera"
      >
        {cameraOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
      </Button>
      {canScreenShare ? (
        <Button
          type="button"
          size="icon"
          variant={screenOn ? "mute" : "ghost"}
          onClick={onToggleScreen}
          aria-label={screenOn ? "Parar compartilhamento" : "Compartilhar tela"}
          title={screenOn ? "Parar compartilhamento" : "Compartilhar tela"}
        >
          <MonitorUp className="size-5" />
        </Button>
      ) : null}
      <Button type="button" size="icon" onClick={onSettings} aria-label="Dispositivos" title="Dispositivos">
        <Settings className="size-5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="danger"
        onClick={onLeave}
        aria-label="Sair da sala"
        title="Sair"
      >
        <PhoneOff className="size-5" />
      </Button>
    </div>
  );
}
