import type { RefObject } from "react";
import { LogOut, Menu, Settings, Users } from "lucide-react";
import { ConnectionQuality, ConnectionState } from "livekit-client";
import { usePwaInstall } from "../../pwa/usePwaInstall.ts";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { ConnectionBadge } from "../controls/ConnectionBadge.tsx";
import { PwaInstallButton, PwaInstallHint } from "./PwaInstallControls.tsx";

type ShellHeaderProps = {
  communityName: string;
  surfaceLabel: string;
  voiceActive: boolean;
  connectionState: ConnectionState;
  quality: ConnectionQuality;
  rttMs: number | null;
  menuRef: RefObject<HTMLButtonElement | null>;
  onOpenSidebar: () => void;
  onOpenPeople: () => void;
};

/** Header exclusivo do canal atual (não da comunidade). */
export function ShellHeader({
  communityName,
  surfaceLabel,
  voiceActive,
  connectionState,
  quality,
  rttMs,
  menuRef,
  onOpenSidebar,
  onOpenPeople,
}: ShellHeaderProps) {
  const textChannel = surfaceLabel.trim().startsWith("#");
  return (
    <header
      className="flex min-h-12 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[#0D0E16] px-2 sm:min-h-[52px] sm:px-3 lg:px-5"
      title={communityName}
    >
      <IconButton
        ref={menuRef}
        type="button"
        size="iconSm"
        className="md:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir comunidades"
      >
        <Icon icon={Menu} size="action" />
      </IconButton>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-bold text-cloud">{surfaceLabel}</p>
        {textChannel ? (
          <p className="hidden truncate text-xs text-haze sm:block">
            Conversas aleatórias, zoeira, novidades e muito mais!
          </p>
        ) : null}
      </div>
      {voiceActive ? (
        <ConnectionBadge state={connectionState} quality={quality} rttMs={rttMs} />
      ) : null}
      <IconButton
        type="button"
        size="iconSm"
        className="xl:hidden"
        onClick={onOpenPeople}
        aria-label="Abrir pessoas"
      >
        <Icon icon={Users} size="action" />
      </IconButton>
    </header>
  );
}

/** Único painel de usuário — rodapé da Channel Sidebar. Um avatar só. */
export function UserFooterBar({
  displayName,
  avatarUrl,
  accountTitle,
  onSignOut,
  onOpenProfile,
  onOpenSettings,
}: {
  displayName: string;
  avatarUrl: string | null;
  accountTitle: string;
  onSignOut: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}) {
  const pwa = usePwaInstall();
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <div className="shrink-0">
      {pwa.showHint ? (
        <PwaInstallHint
          label={pwa.label}
          onInstall={() => void pwa.install()}
          onDismiss={pwa.dismissHint}
        />
      ) : null}
      <div className="flex items-center gap-1 border-t border-white/[0.07] bg-[#0A0B11] px-2 py-2">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition duration-150 ease-out hover:bg-white/[0.05]"
        onClick={onOpenProfile}
        aria-label="Editar perfil"
        title="Editar perfil"
      >
        <span className="relative size-9 shrink-0">
          <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-deck text-[11px] font-semibold text-cloud ring-1 ring-white/[0.08]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-signal ring-2 ring-[#0A0B11]"
            aria-hidden
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-cloud" title={accountTitle}>
            {displayName}
          </span>
          <span className="block truncate text-[11px] text-haze">Editar perfil</span>
        </span>
      </button>
      {pwa.canInstall ? (
        <PwaInstallButton label={pwa.label} onInstall={() => void pwa.install()} />
      ) : null}
      <Tooltip label="Configurações">
        <IconButton
          type="button"
          size="iconSm"
          variant="ghost"
          className="shrink-0"
          onClick={onOpenSettings ?? onOpenProfile}
          aria-label="Configurações"
        >
          <Icon icon={Settings} size="action" />
        </IconButton>
      </Tooltip>
      <Tooltip label="Sair">
        <IconButton
          type="button"
          size="iconSm"
          variant="ghost"
          className="shrink-0"
          onClick={onSignOut}
          aria-label="Sair"
        >
          <Icon icon={LogOut} size="action" />
        </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
