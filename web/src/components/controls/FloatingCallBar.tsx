import { Mic, MicOff, MonitorUp, PhoneOff } from "lucide-react";
import type { ReactNode } from "react";
import type { Root } from "react-dom/client";
import { cn } from "../../lib/utils.ts";
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

function PillButton({
  label,
  onClick,
  active,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full text-white/85 transition duration-150 hover:bg-white/10 hover:text-white",
        active && "bg-white/10 text-white",
        danger && "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
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
    <div className="flex h-full w-full items-center justify-center bg-transparent p-1">
      <div className="flex items-center gap-0.5 rounded-full border border-white/12 bg-black/40 px-1.5 py-1 shadow-[0_8px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <PillButton label={micLabel} onClick={onToggleMic} active={!micOn}>
          <Icon icon={micOn ? Mic : MicOff} size="sm" />
        </PillButton>
        {canScreenShare ? (
          <PillButton label={screenLabel} onClick={onToggleScreen} active={screenOn}>
            <Icon icon={MonitorUp} size="sm" />
          </PillButton>
        ) : null}
        <PillButton label="Sair da chamada" onClick={onLeave} danger>
          <Icon icon={PhoneOff} size="sm" />
        </PillButton>
      </div>
    </div>
  );
}
