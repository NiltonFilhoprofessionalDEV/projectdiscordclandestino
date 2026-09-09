import type { RefObject } from "react";
import { Plus } from "lucide-react";
import type { CommunitySummary } from "../../../../shared/api.ts";
import type { CommunityId } from "../../../../shared/community.ts";
import logoIcon from "../../assets/branding/logo-icon.svg";
import { cn, initials } from "../../lib/utils.ts";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { PulseLine } from "../shell/PulseLine.tsx";

type CommunityRailProps = {
  communities: CommunitySummary[];
  selectedId: CommunityId | null;
  exploring: boolean;
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
    <ul className="flex min-h-0 flex-1 flex-col items-center gap-2.5 overflow-y-auto px-2 py-1">
      {joined.map((community) => {
        const active = !exploring && community.id === selectedId;
        return (
          <li key={community.id}>
            <button
              type="button"
              onClick={() => onSelect(community.id)}
              className={cn(
                "focus-ring relative flex size-11 items-center justify-center rounded-[14px] bg-deck/70 text-xs font-semibold text-haze opacity-70 transition duration-150 ease-out hover:scale-[1.04] hover:bg-card hover:text-cloud hover:opacity-100 active:scale-[0.98]",
                active &&
                  "bg-deck text-cloud opacity-100 shadow-[0_0_18px_rgba(124,58,237,0.28)] ring-2 ring-electric/55",
              )}
              aria-label={community.name}
              aria-current={active ? "page" : undefined}
              title={community.name}
            >
              {active ? (
                <span className="absolute -left-2.5 h-8 w-[3px] rounded-r-full bg-electric transition-all" />
              ) : null}
              {community.avatarUrl ? (
                <img
                  src={community.avatarUrl}
                  alt=""
                  className="size-full rounded-[14px] object-cover"
                />
              ) : (
                initials(community.name)
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Coluna exclusiva de servidores — sem avatar de usuário (isso fica no User Panel da sidebar). */
export function CommunityRail({
  communities,
  selectedId,
  exploring,
  voiceActive,
  onExplore,
  onSelect,
  onCreate,
  createRef,
}: CommunityRailProps) {
  return (
    <nav
      className="flex h-full w-[68px] shrink-0 flex-col items-center gap-3 border-r border-white/[0.06] bg-[#08090F] py-3"
      aria-label="Servidores"
    >
      <Tooltip label="Explorar" side="right">
        <button
          type="button"
          onClick={onExplore}
          className={cn(
            "focus-ring flex size-11 items-center justify-center overflow-hidden rounded-2xl transition duration-150 ease-out hover:scale-[1.04] hover:brightness-110 active:scale-[0.98]",
            exploring && "ring-2 ring-electric/50 ring-offset-2 ring-offset-[#08090F]",
          )}
          aria-label="Gamers de cria — Explorar"
          aria-current={exploring ? "page" : undefined}
        >
          <img src={logoIcon} alt="" className="size-full object-cover" />
        </button>
      </Tooltip>
      <div className="h-px w-7 bg-white/[0.1]" aria-hidden />
      <JoinedRailList
        communities={communities}
        selectedId={selectedId}
        exploring={exploring}
        onSelect={onSelect}
      />
      <div className="mt-auto flex w-full flex-col items-center gap-3 px-2 pb-1">
        <PulseLine active={voiceActive} className="w-full max-w-[2.5rem]" />
        <Tooltip label="Criar comunidade" side="right">
          <button
            ref={createRef}
            type="button"
            onClick={onCreate}
            className="focus-ring flex size-11 items-center justify-center rounded-[14px] bg-electric/20 text-cloud ring-1 ring-electric/40 transition duration-150 ease-out hover:scale-[1.04] hover:bg-electric/30 active:scale-[0.98]"
            aria-label="Criar comunidade"
          >
            <Icon icon={Plus} />
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}
