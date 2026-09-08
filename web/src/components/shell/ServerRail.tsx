import { Home as HomeIcon, Volume2 } from "lucide-react";
import type { RoomId } from "../../../../shared/rooms.ts";
import type { RoomOccupancy } from "../../services/api.ts";
import { cn, initials } from "../../lib/utils.ts";
import { Waveform } from "./Waveform.tsx";
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
      className="hidden h-full w-[4.5rem] shrink-0 flex-col items-center gap-3 py-4 md:flex"
      aria-label="Atalhos das salas"
    >
      <button
        type="button"
        onClick={onExplore}
        className={cn(
          "flex size-12 items-center justify-center rounded-full glass-soft text-fog transition",
          activeRoomId === null && "halo-ring bg-copper/20",
        )}
        aria-label="Explorar"
        title="Explorar"
      >
        <HomeIcon className="size-5" />
      </button>
      <div className="h-px w-8 bg-white/10" />
      {rooms.map((item) => {
        const Icon = RAIL_ICONS[item.id] ?? Volume2;
        const active = item.id === activeRoomId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex size-12 items-center justify-center rounded-full glass-soft text-mist transition hover:text-fog",
              active && "halo-ring text-fog",
            )}
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-2">
        <Waveform />
        <span className="halo-ring flex size-10 items-center justify-center rounded-full bg-panel text-[11px] font-semibold">
          {initials(displayName)}
        </span>
      </div>
    </nav>
  );
}
