import type { RefObject, ReactNode } from "react";
import { Hash, Pencil, Plus, UserPlus, Volume2 } from "lucide-react";
import type { Channel, CommunitySummary } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import type { LoadStatus } from "../../hooks/useCommunities.ts";
import type { VoiceOccupant } from "../../services/api.ts";
import communityBanner from "../../assets/community/welcome-banner.png";
import { cn, initials } from "../../lib/utils.ts";
import { Button, IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Loading } from "../ui/loading.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { UserFooterBar } from "../shell/ShellHeader.tsx";

type ChannelSidebarProps = {
  community: CommunitySummary | null;
  isMember: boolean;
  text: Channel[];
  voice: Channel[];
  activeTextChannelId: ChannelId | null;
  activeVoiceChannelId: ChannelId | null;
  voiceParticipants: ParticipantView[];
  voiceOccupancy: Record<string, VoiceOccupant[]>;
  canManage: boolean;
  status: LoadStatus;
  error: string | null;
  onSelectText: (id: ChannelId) => void;
  onSelectVoice: (id: ChannelId) => void;
  onCreate: () => void;
  onInvite: () => void;
  onEdit: (channel: Channel) => void;
  onEditCommunity?: () => void;
  onRetry: () => void;
  createRef: RefObject<HTMLButtonElement | null>;
  displayName: string;
  avatarUrl: string | null;
  accountTitle: string;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenSettings?: () => void;
};

type VoicePerson = {
  identity: string;
  name: string;
  avatarUrl?: string | null;
  isSpeaking?: boolean;
  isLocal?: boolean;
};

function VoiceMemberRow({ participant }: { participant: VoicePerson }) {
  return (
    <li
      className={cn(
        "flex min-h-8 min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-sm",
        participant.isSpeaking ? "text-cloud" : "text-haze",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-deck text-[9px] font-semibold text-cloud",
          participant.isSpeaking && "speak-halo-sm ring-1 ring-signal/70",
        )}
      >
        {participant.avatarUrl ? (
          <img
            src={participant.avatarUrl}
            alt=""
            className="size-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          initials(participant.name)
        )}
      </span>
      <span className="truncate">
        {participant.name}
        {participant.isLocal ? " (você)" : ""}
      </span>
    </li>
  );
}

function ChannelRow({
  channel,
  active,
  connected,
  icon: ChannelIcon,
  canManage,
  participants,
  onSelect,
  onEdit,
}: {
  channel: Channel;
  active: boolean;
  connected?: boolean;
  icon: typeof Hash;
  canManage: boolean;
  participants?: VoicePerson[];
  onSelect: () => void;
  onEdit: () => void;
}) {
  const count = participants?.length ?? 0;
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "group relative flex min-h-10 w-full min-w-0 items-center gap-1 rounded-xl px-1 transition duration-150 ease-out",
          active
            ? "bg-[rgba(124,58,237,0.20)] text-cloud"
            : "text-haze hover:bg-white/[0.05] hover:text-cloud",
        )}
      >
        {active ? (
          <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-[#A78BFA]" aria-hidden />
        ) : null}
        <button
          type="button"
          onClick={onSelect}
          aria-current={active ? "page" : undefined}
          className="focus-ring flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 text-left text-sm"
        >
          <Icon
            icon={ChannelIcon}
            size="action"
            className={connected ? "text-signal" : active ? "text-[#A78BFA]" : "text-haze"}
          />
          <span className="flex-1 truncate font-medium">{channel.name}</span>
          {count > 0 ? (
            <span className="control-badge bg-white/5 text-haze tabular-nums">{count}</span>
          ) : null}
        </button>
        {canManage ? (
          <Tooltip label="Editar canal">
            <IconButton
              type="button"
              size="iconSm"
              variant="ghost"
              className="mr-0.5 size-8 min-h-8 min-w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              aria-label={`Editar canal ${channel.name}`}
              onClick={onEdit}
            >
              <Icon icon={Pencil} size="sm" />
            </IconButton>
          </Tooltip>
        ) : null}
      </div>
      {participants && participants.length > 0 ? (
        <ul className="mt-1 mb-1 ml-7 space-y-0.5" aria-label={`Na chamada ${channel.name}`}>
          {participants.map((participant) => (
            <VoiceMemberRow key={participant.identity} participant={participant} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TextChannels({
  channels,
  activeId,
  canManage,
  onSelect,
  onEdit,
}: {
  channels: Channel[];
  activeId: ChannelId | null;
  canManage: boolean;
  onSelect: (id: ChannelId) => void;
  onEdit: (channel: Channel) => void;
}) {
  return (
    <>
      <p className="px-2 pt-2 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
        Texto
      </p>
      <nav className="mt-2 flex flex-col gap-1" aria-label="Canais de texto">
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            active={channel.id === activeId}
            icon={Hash}
            canManage={canManage}
            onSelect={() => onSelect(channel.id)}
            onEdit={() => onEdit(channel)}
          />
        ))}
      </nav>
    </>
  );
}

function occupantsForChannel(
  channelId: ChannelId,
  activeId: ChannelId | null,
  liveParticipants: ParticipantView[],
  occupancy: Record<string, VoiceOccupant[]>,
): VoicePerson[] {
  if (channelId === activeId) {
    return liveParticipants;
  }
  return (occupancy[channelId] ?? []).map((occupant) => ({
    identity: occupant.identity,
    name: occupant.name,
    avatarUrl: occupant.avatarUrl ?? null,
  }));
}

function VoiceChannels({
  channels,
  activeId,
  voiceParticipants,
  voiceOccupancy,
  canManage,
  onSelect,
  onEdit,
}: {
  channels: Channel[];
  activeId: ChannelId | null;
  voiceParticipants: ParticipantView[];
  voiceOccupancy: Record<string, VoiceOccupant[]>;
  canManage: boolean;
  onSelect: (id: ChannelId) => void;
  onEdit: (channel: Channel) => void;
}) {
  return (
    <>
      <p className="px-2 pt-3 text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
        Voz
      </p>
      <nav className="mt-2 flex flex-col gap-1" aria-label="Canais de voz">
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            active={channel.id === activeId}
            connected={channel.id === activeId}
            icon={Volume2}
            canManage={canManage}
            participants={occupantsForChannel(
              channel.id,
              activeId,
              voiceParticipants,
              voiceOccupancy,
            )}
            onSelect={() => onSelect(channel.id)}
            onEdit={() => onEdit(channel)}
          />
        ))}
      </nav>
    </>
  );
}

export function ChannelSidebar({
  community,
  isMember,
  text,
  voice,
  activeTextChannelId,
  activeVoiceChannelId,
  voiceParticipants,
  voiceOccupancy,
  canManage,
  status,
  error,
  onSelectText,
  onSelectVoice,
  onCreate,
  onInvite,
  onEdit,
  onEditCommunity,
  onRetry,
  createRef,
  displayName,
  avatarUrl,
  accountTitle,
  onSignOut,
  onOpenProfile,
  onOpenSettings,
}: ChannelSidebarProps) {
  let body: ReactNode;
  if (!community) {
    body = <p className="px-2 text-sm text-haze">Abra o Explore para entrar em um espaço.</p>;
  } else if (!isMember) {
    body = (
      <p className="px-2 text-sm text-haze">
        Você não é membro. Peça um convite para ver os canais.
      </p>
    );
  } else if (status === "error") {
    body = (
      <div className="px-2">
        <p className="text-sm text-coral">{error}</p>
        <Button type="button" variant="secondary" className="mt-3 w-full" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    );
  } else if (status !== "ready") {
    body = <Loading className="px-2 py-3" label="Carregando canais…" />;
  } else {
    body = (
      <>
        <TextChannels
          channels={text}
          activeId={activeTextChannelId}
          canManage={canManage}
          onSelect={onSelectText}
          onEdit={onEdit}
        />
        <VoiceChannels
          channels={voice}
          activeId={activeVoiceChannelId}
          voiceParticipants={voiceParticipants}
          voiceOccupancy={voiceOccupancy}
          canManage={canManage}
          onSelect={onSelectVoice}
          onEdit={onEdit}
        />
      </>
    );
  }

  return (
    <aside className="flex h-full w-[256px] shrink-0 flex-col border-r border-white/[0.07] bg-panel">
      <div className="relative min-h-[7.5rem] shrink-0 overflow-hidden border-b border-white/[0.07]">
        <img
          src={communityBanner}
          alt=""
          className="absolute inset-0 size-full object-cover object-[center_right]"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,15,0.45)_0%,rgba(16,17,26,0.78)_50%,rgba(16,17,26,0.97)_100%)]"
          aria-hidden
        />
        <div className="relative flex h-full min-h-[7.5rem] flex-col justify-end px-4 pb-3.5 pt-8">
          <div className="flex items-end gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-deck/80 text-xs font-semibold text-cloud ring-1 ring-white/15">
              {community?.avatarUrl ? (
                <img src={community.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initials(community?.name ?? "G")
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
                Comunidade
              </p>
              <div className="mt-1 flex items-start gap-1">
                <h2 className="min-w-0 flex-1 break-words font-display text-[17px] font-bold text-cloud drop-shadow-sm">
                  {community?.name ?? "DiscordClandestino"}
                </h2>
                {onEditCommunity ? (
                  <Tooltip label="Editar comunidade">
                    <IconButton
                      type="button"
                      size="iconSm"
                      variant="ghost"
                      className="mt-0.5 size-6 min-h-6 min-w-6 shrink-0 rounded-md bg-transparent p-0 text-haze ring-0 hover:bg-white/10 hover:text-cloud"
                      onClick={onEditCommunity}
                      aria-label="Editar comunidade"
                    >
                      <Icon icon={Pencil} size="sm" className="size-3.5" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          </div>
          {community ? (
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-haze">
              <span
                className="size-1.5 rounded-full bg-signal shadow-[0_0_8px_rgba(34,197,94,0.65)]"
                aria-hidden
              />
              {community.onlineCount} online
            </span>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-2">{body}</div>
      {canManage ? (
        <div className="shrink-0 space-y-2 border-t border-white/[0.07] p-3">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={onInvite}
            aria-label="Convidar amigos"
          >
            <Icon icon={UserPlus} size="action" />
            Convidar
          </Button>
          <Button
            ref={createRef}
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onCreate}
            aria-label="Criar canal"
          >
            <Icon icon={Plus} size="action" />
            Criar canal
          </Button>
        </div>
      ) : null}
      <UserFooterBar
        displayName={displayName}
        avatarUrl={avatarUrl}
        accountTitle={accountTitle}
        onSignOut={onSignOut}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
      />
    </aside>
  );
}
