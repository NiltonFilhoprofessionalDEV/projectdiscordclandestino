import type { RefObject, ReactNode } from "react";
import { Hash, Pencil, Plus, UserPlus, Volume2 } from "lucide-react";
import type { Channel, CommunitySummary } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import type { LoadStatus } from "../../hooks/useCommunities.ts";
import { cn, initials } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { UserFooterBar } from "../shell/ShellHeader.tsx";

type ChannelSidebarProps = {
  community: CommunitySummary | null;
  isMember: boolean;
  text: Channel[];
  voice: Channel[];
  activeTextChannelId: ChannelId | null;
  activeVoiceChannelId: ChannelId | null;
  voiceParticipants: ParticipantView[];
  canManage: boolean;
  status: LoadStatus;
  error: string | null;
  onSelectText: (id: ChannelId) => void;
  onSelectVoice: (id: ChannelId) => void;
  onCreate: () => void;
  onInvite: () => void;
  onEdit: (channel: Channel) => void;
  onRetry: () => void;
  createRef: RefObject<HTMLButtonElement | null>;
  displayName: string;
  avatarUrl: string | null;
  accountTitle: string;
  onSignOut: () => void;
  onOpenProfile: () => void;
};

function VoiceMemberRow({ participant }: { participant: ParticipantView }) {
  return (
    <li
      className={cn(
        "flex min-h-8 items-center gap-2 rounded-lg px-2 py-1 text-sm",
        participant.isSpeaking ? "text-cloud" : "text-haze",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-deck text-[9px] font-semibold text-cloud",
          participant.isSpeaking && "ring-2 ring-emerald-400",
        )}
      >
        {participant.avatarUrl ? (
          <img src={participant.avatarUrl} alt="" className="size-full object-cover" />
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
  icon: Icon,
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
  participants?: ParticipantView[];
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div>
      <div
        className={cn(
          "group relative flex min-h-11 w-full items-center gap-1 rounded-xl px-1 transition",
          active ? "bg-electric/14 text-cloud" : "text-haze hover:bg-white/5 hover:text-cloud",
        )}
      >
        {active ? <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-electric" /> : null}
        <button
          type="button"
          onClick={onSelect}
          aria-current={active ? "page" : undefined}
          className="focus-ring flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 text-left text-sm"
        >
          <Icon
            className={cn(
              "size-4 shrink-0",
              connected ? "text-emerald-400" : active ? "text-electric" : "text-haze",
            )}
          />
          <span className="flex-1 truncate font-medium">{channel.name}</span>
        </button>
        {canManage ? (
          <button
            type="button"
            className="mr-1 rounded-md p-1.5 opacity-0 transition group-hover:opacity-100 hover:bg-white/10"
            aria-label={`Editar canal ${channel.name}`}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
          </button>
        ) : null}
      </div>
      {connected && participants && participants.length > 0 ? (
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
      <p className="px-2 pt-2 text-xs font-semibold tracking-[0.14em] text-haze uppercase">Texto</p>
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

function VoiceChannels({
  channels,
  activeId,
  voiceParticipants,
  canManage,
  onSelect,
  onEdit,
}: {
  channels: Channel[];
  activeId: ChannelId | null;
  voiceParticipants: ParticipantView[];
  canManage: boolean;
  onSelect: (id: ChannelId) => void;
  onEdit: (channel: Channel) => void;
}) {
  return (
    <>
      <p className="px-2 pt-3 text-xs font-semibold tracking-[0.14em] text-haze uppercase">Voz</p>
      <nav className="mt-2 flex flex-col gap-1" aria-label="Canais de voz">
        {channels.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            active={channel.id === activeId}
            connected={channel.id === activeId}
            icon={Volume2}
            canManage={canManage}
            participants={channel.id === activeId ? voiceParticipants : undefined}
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
  canManage,
  status,
  error,
  onSelectText,
  onSelectVoice,
  onCreate,
  onInvite,
  onEdit,
  onRetry,
  createRef,
  displayName,
  avatarUrl,
  accountTitle,
  onSignOut,
  onOpenProfile,
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
        <Button type="button" className="mt-3 w-full" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    );
  } else if (status !== "ready") {
    body = <p className="px-2 text-sm text-haze">Carregando canais…</p>;
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
          canManage={canManage}
          onSelect={onSelectVoice}
          onEdit={onEdit}
        />
      </>
    );
  }

  return (
    <aside className="surface flex h-full w-64 shrink-0 flex-col border-y-0 border-l-0">
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-haze uppercase">Comunidade</p>
        <h2 className="mt-2 truncate font-display text-lg text-cloud">
          {community?.name ?? "Selecione uma comunidade"}
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">{body}</div>
      {canManage ? (
        <div className="space-y-2 border-t border-haze/10 p-3">
          <Button
            type="button"
            className="w-full"
            onClick={onInvite}
            aria-label="Convidar amigos"
          >
            <UserPlus className="size-4" />
            Convidar
          </Button>
          <Button ref={createRef} type="button" className="w-full" onClick={onCreate} aria-label="Criar canal">
            <Plus className="size-4" />
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
      />
    </aside>
  );
}
