import {
  AudioLines,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Settings,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../ui/button.tsx";

type ControlBarProps = {
  micOn: boolean;
  voiceActivityOn: boolean;
  cameraOn: boolean;
  screenOn: boolean;
  canScreenShare: boolean;
  onToggleMic: () => void;
  onToggleVoiceActivity: () => void;
  onToggleCamera: () => void;
  onToggleScreen: () => void;
  onSettings: () => void;
  onLeave: () => void;
  outputVolume: number;
  outputMuted: boolean;
  onOutputVolume: (value: number) => void;
  onToggleOutputMute: () => void;
};

export function ControlBar({
  micOn,
  voiceActivityOn,
  cameraOn,
  screenOn,
  canScreenShare,
  onToggleMic,
  onToggleVoiceActivity,
  onToggleCamera,
  onToggleScreen,
  onSettings,
  onLeave,
  outputVolume,
  outputMuted,
  onOutputVolume,
  onToggleOutputMute,
}: ControlBarProps) {
  return (
    <div className="glass-bar sticky bottom-3 z-20 mx-auto mb-4 flex w-fit flex-wrap items-center justify-center gap-2 rounded-2xl px-3 py-2 shadow-glow">
      <Button
        type="button"
        size="icon"
        variant={micOn ? "live" : "mute"}
        onClick={onToggleMic}
        aria-label={micOn ? "Mutar microfone" : "Desmutar microfone"}
        title={micOn ? "Microfone ligado (clique para mutar)" : "Microfone mutado"}
      >
        {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant={voiceActivityOn ? "live" : "ghost"}
        onClick={onToggleVoiceActivity}
        aria-label={
          voiceActivityOn
            ? "Desligar reconhecimento de voz"
            : "Ligar reconhecimento de voz"
        }
        title={
          voiceActivityOn
            ? "Reconhecimento de voz: só transmite quando você fala"
            : "Reconhecimento de voz desligado (transmissão contínua)"
        }
      >
        <AudioLines className="size-5" />
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
        variant={outputMuted ? "mute" : "ghost"}
        onClick={onToggleOutputMute}
        aria-label={outputMuted ? "Ativar áudio recebido" : "Mutar áudio recebido"}
        title="Áudio recebido"
      >
        {outputMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </Button>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(outputVolume * 100)}
        onChange={(event) => onOutputVolume(Number(event.target.value) / 100)}
        aria-label="Volume do áudio recebido"
        className="w-24 accent-electric"
      />
      <span className="mx-1 h-7 w-px bg-haze/15" aria-hidden />
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
