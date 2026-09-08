import { Volume2 } from "lucide-react";
import type { RoomId } from "../../../../shared/rooms.ts";
import type { RoomOccupancy } from "../../services/api.ts";
import { cn } from "../../lib/utils.ts";

function occupancyLabel(count: number): string {
  if (count === 1) {
    return "1 pessoa";
  }
  return `${count} pessoas`;
}

type RoomListProps = {
  rooms: RoomOccupancy[];
  activeId: RoomId | null;
  onSelect: (id: RoomId) => void;
};

export function RoomList({ rooms, activeId, onSelect }: RoomListProps) {
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Salas">
      {rooms.map((room) => {
        const active = room.id === activeId;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition",
              active
                ? "bg-electric/14 text-cloud"
                : "text-haze hover:bg-white/5 hover:text-cloud",
            )}
          >
            {active ? (
              <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-electric" />
            ) : null}
            <Volume2 className={cn("size-4 shrink-0", active ? "text-electric" : "text-haze")} />
            <span className="flex-1 font-medium">{room.label}</span>
            <span className="text-xs text-haze">{occupancyLabel(room.occupantCount)}</span>
          </button>
        );
      })}
    </nav>
  );
}
