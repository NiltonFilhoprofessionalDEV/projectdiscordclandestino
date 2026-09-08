import { Volume2 } from "lucide-react";
import type { RoomId } from "../../../../shared/rooms.ts";
import type { RoomOccupancy } from "../../services/api.ts";
import { cn, initials } from "../../lib/utils.ts";
import { PulseLine } from "./PulseLine.tsx";
import { RAIL_ICONS } from "./railIcons.ts";

type ServerRailProps = {
  rooms: RoomOccupancy[];
  activeRoomId: RoomId | null;
  displayName: string;
  onExplore: () => void;
  onSelect: (id: RoomId) => void;
};

export function ServerRail({
  rooms,
  activeRoomId,
  displayName,
  onExplore,
  onSelect,
}: ServerRailProps) {
  return (
    <nav
      className="hidden h-full w-[4.75rem] shrink-0 flex-col items-center gap-3 bg-abyss py-5 md:flex"
      aria-label="Atalhos das salas"
    >
      <button
        type="button"
        onClick={onExplore}
        className={cn(
          "focus-ring flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-electric to-pulse font-display text-lg text-white shadow-[0_12px_26px_rgba(93,124,255,0.26)] transition hover:brightness-110",
          activeRoomId === null && "ring-2 ring-electric/35 ring-offset-2 ring-offset-abyss",
        )}
        aria-label="Explorar Salas"
        title="Explorar Salas"
      >
        S
      </button>
      <div className="my-1 h-px w-8 bg-haze/12" />
      {rooms.map((item) => {
        const Icon = RAIL_ICONS[item.id] ?? Volume2;
        const active = item.id === activeRoomId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "focus-ring relative flex size-11 items-center justify-center rounded-xl bg-deck/65 text-haze transition hover:bg-deck hover:text-cloud",
              active && "bg-deck text-cloud ring-1 ring-electric/35",
            )}
            aria-label={item.label}
            title={item.label}
          >
            {active ? (
              <span className="absolute -left-4 h-6 w-[3px] rounded-r-full bg-electric" />
            ) : null}
            <Icon className="size-5" />
          </button>
        );
      })}
      <div className="mt-auto flex w-full flex-col items-center gap-3 px-3">
        <PulseLine active={activeRoomId !== null} className="w-full" />
        <span className="flex size-10 items-center justify-center rounded-xl bg-deck text-[11px] font-semibold text-cloud ring-1 ring-haze/15">
          {initials(displayName)}
        </span>
      </div>
    </nav>
  );
}
