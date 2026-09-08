import { Compass } from "lucide-react";
import type { RoomId } from "../../../../shared/rooms.ts";
import type { RoomOccupancy } from "../../services/api.ts";
import { cn } from "../../lib/utils.ts";
import { RoomList } from "../rooms/RoomList.tsx";
import { Input } from "../ui/input.tsx";

type NavigationPanelProps = {
  rooms: RoomOccupancy[];
  activeRoomId: RoomId | null;
  draftName: string;
  occupancyError: string | null;
  onExplore: () => void;
  onSelect: (id: RoomId) => void;
  onDraftName: (name: string) => void;
  onCommitName: () => void;
};

export function NavigationPanel({
  rooms,
  activeRoomId,
  draftName,
  occupancyError,
  onExplore,
  onSelect,
  onDraftName,
  onCommitName,
}: NavigationPanelProps) {
  return (
    <aside className="surface flex h-full w-64 shrink-0 flex-col border-y-0 border-l-0">
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-haze uppercase">
          Comunidades
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={onExplore}
          aria-current={activeRoomId === null ? "page" : undefined}
          className={cn(
            "focus-ring mx-3 flex min-h-11 w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition",
            activeRoomId === null
              ? "bg-electric/14 text-cloud"
              : "text-haze hover:bg-white/5 hover:text-cloud",
          )}
        >
          <Compass className={cn("size-4", activeRoomId === null && "text-electric")} />
          Explorar
        </button>
        <RoomList rooms={rooms} activeId={activeRoomId} onSelect={onSelect} />
        {occupancyError ? (
          <p className="px-5 text-xs text-coral">{occupancyError}</p>
        ) : null}
      </div>
      <div className="border-t border-haze/10 p-4">
        <label className="text-xs font-medium text-haze" htmlFor="rename">
          Seu nome
        </label>
        <Input
          id="rename"
          value={draftName}
          onChange={(event) => onDraftName(event.target.value)}
          onBlur={onCommitName}
          className="mt-2 h-11"
        />
      </div>
    </aside>
  );
}
