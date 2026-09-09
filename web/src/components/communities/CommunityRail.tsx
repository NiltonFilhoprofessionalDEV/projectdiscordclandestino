import type { RefObject } from "react";
import { Compass, Plus } from "lucide-react";
import type { CommunitySummary } from "../../../../shared/api.ts";
import type { CommunityId } from "../../../../shared/community.ts";
import { cn, initials } from "../../lib/utils.ts";
import { PulseLine } from "../shell/PulseLine.tsx";

type CommunityRailProps = {
  communities: CommunitySummary[];
  selectedId: CommunityId | null;
  exploring: boolean;
  displayName: string;
  avatarUrl: string | null;
  voiceActive: boolean;
  onExplore: () => void;
  onSelect: (id: CommunityId) => void;
  onCreate: () => void;
  createRef: RefObject<HTMLButtonElement | null>;
};

function JoinedRailList({
  communities,
  selectedId,
  exploring,
  onSelect,
}: {
  communities: CommunitySummary[];
  selectedId: CommunityId | null;
  exploring: boolean;
  onSelect: (id: CommunityId) => void;
}) {
  const joined = communities.filter((item) => item.role !== null);
  return (
    <ul className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-2">
      {joined.map((community) => {
        const active = !exploring && community.id === selectedId;
        return (
          <li key={community.id}>
            <button
              type="button"
              onClick={() => onSelect(community.id)}
              className={cn(
                "focus-ring relative flex size-11 items-center justify-center rounded-xl bg-deck/65 text-xs font-semibold text-haze transition hover:bg-deck hover:text-cloud",
                active && "bg-deck text-cloud ring-1 ring-electric/35",
              )}
              aria-label={community.name}
              aria-current={active ? "page" : undefined}
              title={community.name}
            >
              {active ? (
                <span className="absolute -left-3 h-6 w-[3px] rounded-r-full bg-electric" />
              ) : null}
              {initials(community.name)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CommunityRail({
  communities,
  selectedId,
  exploring,
  displayName,
  avatarUrl,
  voiceActive,
  onExplore,
  onSelect,
  onCreate,
  createRef,
}: CommunityRailProps) {
  return (
    <nav
      className="flex h-full w-[76px] shrink-0 flex-col items-center gap-3 bg-abyss py-5"
      aria-label="Comunidades"
    >
      <button
        type="button"
        onClick={onExplore}
        className={cn(
          "focus-ring flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-electric to-pulse font-display text-lg text-white shadow-[0_12px_26px_rgba(93,124,255,0.26)] transition hover:brightness-110",
          exploring && "ring-2 ring-electric/35 ring-offset-2 ring-offset-abyss",
        )}
        aria-label="Explorar comunidades"
        aria-current={exploring ? "page" : undefined}
        title="Explorar"
      >
        <Compass className="size-5" />
      </button>
      <div className="my-1 h-px w-8 bg-haze/12" />
      <JoinedRailList
        communities={communities}
        selectedId={selectedId}
        exploring={exploring}
        onSelect={onSelect}
      />
      <button
        ref={createRef}
        type="button"
        onClick={onCreate}
        className="focus-ring flex size-11 items-center justify-center rounded-xl bg-deck/65 text-cloud transition hover:bg-deck"
        aria-label="Criar comunidade"
        title="Criar comunidade"
      >
        <Plus className="size-5" />
      </button>
      <RailFooter voiceActive={voiceActive} displayName={displayName} avatarUrl={avatarUrl} />
    </nav>
  );
}

function RailFooter({
  voiceActive,
  displayName,
  avatarUrl,
}: {
  voiceActive: boolean;
  displayName: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="mt-auto flex w-full flex-col items-center gap-3 px-3">
      <PulseLine active={voiceActive} className="w-full" />
      <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-deck text-[11px] font-semibold text-cloud ring-1 ring-haze/15">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initials(displayName)
        )}
      </span>
    </div>
  );
}
