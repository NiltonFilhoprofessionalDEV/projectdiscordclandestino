import type { RefObject } from "react";
import { LogOut, Menu } from "lucide-react";
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
  menuRef: RefObject<HTMLButtonElement | null>;
  onOpenSidebar: () => void;
};

export function ShellHeader({
  communityName,
  surfaceLabel,
  voiceActive,
  connectionState,
  quality,
  rttMs,
  menuRef,
  onOpenSidebar,
}: ShellHeaderProps) {
  return (
    <header className="glass-bar flex min-h-16 items-center gap-3 border-x-0 border-t-0 px-4 lg:px-6">
      <Button
        ref={menuRef}
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
    </header>
  );
}

export function UserFooterBar({
  displayName,
  avatarUrl,
  accountTitle,
  onSignOut,
}: {
  displayName: string;
  avatarUrl: string | null;
  accountTitle: string;
  onSignOut: () => void;
}) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div className="flex items-center gap-2 border-t border-haze/10 bg-abyss/80 px-3 py-2">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-deck text-[11px] font-semibold text-cloud ring-1 ring-haze/15">
        {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-cloud" title={accountTitle}>
          {displayName}
        </p>
        <p className="truncate text-[11px] text-haze">Online</p>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onSignOut}
        aria-label="Sair"
        title="Sair"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
