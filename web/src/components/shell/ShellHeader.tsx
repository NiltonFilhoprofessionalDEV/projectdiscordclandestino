import { Menu } from "lucide-react";
import { ConnectionQuality, ConnectionState } from "livekit-client";
import { Button } from "../ui/button.tsx";
import { ConnectionBadge } from "../controls/ConnectionBadge.tsx";

type ShellHeaderProps = {
  communityName: string;
  surfaceLabel: string;
  voiceActive: boolean;
  connectionState: ConnectionState;
  quality: ConnectionQuality;
  rttMs: number | null;
  accountTitle: string;
  onOpenSidebar: () => void;
  onSignOut: () => void;
};

export function ShellHeader({
  communityName,
  surfaceLabel,
  voiceActive,
  connectionState,
  quality,
  rttMs,
  accountTitle,
  onOpenSidebar,
  onSignOut,
}: ShellHeaderProps) {
  return (
    <header className="glass-bar flex min-h-16 items-center gap-3 border-x-0 border-t-0 px-4 lg:px-6">
      <Button
        type="button"
        size="icon"
        className="md:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir comunidades"
      >
        <Menu className="size-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl">{communityName}</h1>
        {voiceActive ? (
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="truncate text-xs text-haze">{surfaceLabel}</p>
            <ConnectionBadge state={connectionState} quality={quality} rttMs={rttMs} />
          </div>
        ) : (
          <p className="truncate text-xs text-haze">{surfaceLabel}</p>
        )}
      </div>
      <Button type="button" onClick={onSignOut} title={accountTitle}>
        Sair
      </Button>
    </header>
  );
}
