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
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { cn } from "../../lib/utils.ts";

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
  className?: string;
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
  className,
}: ControlBarProps) {
  const micLabel = micOn ? "Mutar microfone" : "Desmutar microfone";
  const voiceLabel = voiceActivityOn
    ? "Desligar reconhecimento de voz"
    : "Ligar reconhecimento de voz";
  const cameraLabel = cameraOn ? "Desligar câmera" : "Ligar câmera";
  const screenLabel = screenOn ? "Configurar transmissão" : "Compartilhar tela";
  const outputLabel = outputMuted ? "Ativar áudio recebido" : "Mutar áudio recebido";

  return (
    <div
      className={cn(
        "flex w-full max-w-full items-center justify-center gap-1.5 rounded-[18px] border border-white/[0.08] bg-[#12131D]/95 px-2 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:w-fit sm:max-w-[calc(100vw-2rem)] sm:flex-wrap sm:px-2.5",
        className,
      )}
    >
      <Tooltip label={micOn ? "Microfone ligado" : "Microfone mutado"}>
        <IconButton
          type="button"
          variant={micOn ? "live" : "mute"}
          onClick={onToggleMic}
          aria-label={micLabel}
        >
          <Icon icon={micOn ? Mic : MicOff} />
        </IconButton>
      </Tooltip>
      <Tooltip label={voiceActivityOn ? "Só transmite quando você fala" : "Transmissão contínua"}>
        <IconButton
          type="button"
          variant={voiceActivityOn ? "live" : "secondary"}
          onClick={onToggleVoiceActivity}
          aria-label={voiceLabel}
        >
          <Icon icon={AudioLines} />
        </IconButton>
      </Tooltip>
      <Tooltip label="Câmera">
        <IconButton
          type="button"
          variant={cameraOn ? "live" : "secondary"}
          onClick={onToggleCamera}
          aria-label={cameraLabel}
        >
          <Icon icon={cameraOn ? Video : VideoOff} />
        </IconButton>
      </Tooltip>
      {canScreenShare ? (
        <Tooltip label={screenLabel}>
          <IconButton
            type="button"
            variant={screenOn ? "live" : "secondary"}
            className="hidden sm:inline-flex"
            onClick={onToggleScreen}
            aria-label={screenLabel}
          >
            <Icon icon={MonitorUp} />
          </IconButton>
        </Tooltip>
      ) : null}
      <Tooltip label="Dispositivos">
        <IconButton
          type="button"
          variant="secondary"
          onClick={onSettings}
          aria-label="Dispositivos"
        >
          <Icon icon={Settings} />
        </IconButton>
      </Tooltip>
      <Tooltip label="Áudio recebido">
        <IconButton
          type="button"
          variant={outputMuted ? "mute" : "secondary"}
          onClick={onToggleOutputMute}
          aria-label={outputLabel}
        >
          <Icon icon={outputMuted ? VolumeX : Volume2} />
        </IconButton>
      </Tooltip>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(outputVolume * 100)}
        onChange={(event) => onOutputVolume(Number(event.target.value) / 100)}
        aria-label="Volume do áudio recebido"
        className="voice-slider mx-1 hidden w-20 sm:block"
      />
      <span className="mx-0.5 h-7 w-px bg-white/[0.1]" aria-hidden />
      <Tooltip label="Sair da chamada">
        <IconButton type="button" variant="danger" onClick={onLeave} aria-label="Sair da sala">
          <Icon icon={PhoneOff} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
