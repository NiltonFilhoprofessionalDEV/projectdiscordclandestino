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
import { useState } from "react";
import { IconButton } from "../ui/button.tsx";
import { HoverVolumePopover } from "../ui/HoverVolumePopover.tsx";
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
    ? "Desligar: só transmite quando você fala"
    : "Ligar: só transmite quando você fala";
  const cameraLabel = cameraOn ? "Desligar câmera" : "Ligar câmera";
  const screenLabel = screenOn ? "Configurar transmissão" : "Compartilhar tela";
  const outputLabel = outputMuted ? "Ativar áudio recebido" : "Mutar áudio recebido";
  const [roomVolOpen, setRoomVolOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-nowrap items-center justify-center gap-1.5 overflow-visible rounded-[18px] border border-white/[0.08] bg-[#12131D]/95 px-2.5 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:w-fit sm:max-w-[calc(100vw-2rem)]",
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
      <Tooltip
        label={
          voiceActivityOn
            ? "Modo voz: só transmite quando você fala"
            : "Transmissão contínua (microfone sempre aberto)"
        }
      >
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
      <HoverVolumePopover
        open={roomVolOpen}
        onOpenChange={setRoomVolOpen}
        panel={
          <input
            id="room-volume-slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(outputVolume * 100)}
            onChange={(event) => onOutputVolume(Number(event.target.value) / 100)}
            aria-label="Volume da sala"
            className="voice-slider-vertical"
          />
        }
      >
        <IconButton
          type="button"
          variant={outputMuted ? "mute" : "secondary"}
          onClick={onToggleOutputMute}
          aria-label={outputLabel}
          aria-expanded={roomVolOpen}
          aria-controls={roomVolOpen ? "room-volume-slider" : undefined}
          title="Áudio da sala"
        >
          <Icon icon={outputMuted ? VolumeX : Volume2} />
        </IconButton>
      </HoverVolumePopover>
      <Tooltip label="Sair da chamada">
        <IconButton type="button" variant="danger" onClick={onLeave} aria-label="Sair da sala">
          <Icon icon={PhoneOff} />
        </IconButton>
      </Tooltip>
    </div>
  );
}
