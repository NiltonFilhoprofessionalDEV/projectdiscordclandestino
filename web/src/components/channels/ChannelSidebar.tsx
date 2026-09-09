import type { RefObject } from "react";
import { Hash, Plus, Volume2 } from "lucide-react";
import type { Channel, CommunitySummary } from "../../../../shared/api.ts";
import type { ChannelId } from "../../../../shared/community.ts";
import { cn } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import type { LoadStatus } from "../../hooks/useCommunities.ts";

type ChannelSidebarProps = {
  community: CommunitySummary | null;
  text: Channel[];
  voice: Channel[];
  activeTextChannelId: ChannelId | null;
  activeVoiceChannelId: ChannelId | null;
  canManage: boolean;
  status: LoadStatus;
  error: string | null;
  onSelectText: (id: ChannelId) => void;
  onSelectVoice: (id: ChannelId) => void;
  onCreate: () => void;
  onRetry: () => void;
  createRef: RefObject<HTMLButtonElement | null>;
  className?: string;
};

function ChannelButton({
  channel,
  active,
  connected,
  icon: Icon,
  onSelect,
}: {
  channel: Channel;
  active: boolean;
  connected?: boolean;
  icon: typeof Hash;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition",
        active ? "bg-electric/14 text-cloud" : "text-haze hover:bg-white/5 hover:text-cloud",
      )}
    >
      {active ? <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-electric" /> : null}
      <Icon className={cn("size-4 shrink-0", active ? "text-electric" : "text-haze")} />
      <span className="flex-1 truncate font-medium">{channel.name}</span>
      {connected ? <span className="size-2 rounded-full bg-coral" aria-label="Conectado" /> : null}
    </button>
  );
}

export function ChannelSidebar({
  community,
  text,
  voice,
  activeTextChannelId,
  activeVoiceChannelId,
  canManage,
  status,
  error,
  onSelectText,
  onSelectVoice,
  onCreate,
  onRetry,
  createRef,
  className,
}: ChannelSidebarProps) {
  return (
    <aside className={cn("surface flex h-full w-64 shrink-0 flex-col border-y-0 border-l-0", className)}>
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-haze uppercase">Comunidade</p>
        <h2 className="mt-2 truncate font-display text-lg text-cloud">
          {community?.name ?? "Selecione uma comunidade"}
        </h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {!community ? (
          <p className="px-2 text-sm text-haze">Abra o Explore para entrar em um espaço.</p>
        ) : null}
        {community && status === "error" ? (
          <div className="px-2">
            <p className="text-sm text-coral">{error}</p>
            <Button type="button" className="mt-3 w-full" onClick={onRetry}>
              Tentar de novo
            </Button>
          </div>
        ) : null}
        {community && status !== "error" ? (
          <>
            <p className="px-2 pt-2 text-xs font-semibold tracking-[0.14em] text-haze uppercase">
              Texto
            </p>
            <nav className="mt-2 flex flex-col gap-1" aria-label="Canais de texto">
              {text.map((channel) => (
                <ChannelButton
                  key={channel.id}
                  channel={channel}
                  active={channel.id === activeTextChannelId}
                  icon={Hash}
                  onSelect={() => onSelectText(channel.id)}
                />
              ))}
            </nav>
            <p className="px-2 pt-5 text-xs font-semibold tracking-[0.14em] text-haze uppercase">
              Voz
            </p>
            <nav className="mt-2 flex flex-col gap-1" aria-label="Canais de voz">
              {voice.map((channel) => (
                <ChannelButton
                  key={channel.id}
                  channel={channel}
                  active={channel.id === activeVoiceChannelId}
                  connected={channel.id === activeVoiceChannelId}
                  icon={Volume2}
                  onSelect={() => onSelectVoice(channel.id)}
                />
              ))}
            </nav>
          </>
        ) : null}
      </div>
      {canManage ? (
        <div className="border-t border-haze/10 p-3">
          <Button
            ref={createRef}
            type="button"
            className="w-full"
            onClick={onCreate}
            aria-label="Criar canal"
          >
            <Plus className="size-4" />
            Criar canal
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
