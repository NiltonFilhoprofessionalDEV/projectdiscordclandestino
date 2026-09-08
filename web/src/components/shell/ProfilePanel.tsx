import { getRoomLabel, type RoomId } from "../../../../shared/rooms.ts";
import type { ParticipantView } from "../../hooks/useParticipants.ts";
import type { RoomOccupancy } from "../../services/api.ts";
import { initials } from "../../lib/utils.ts";
import { ParticipantList } from "../participants/ParticipantList.tsx";

type ProfilePanelProps = {
  displayName: string;
  activeRoomId: RoomId | null;
  participants: ParticipantView[];
  liveRooms: RoomOccupancy[];
  onSelect: (id: RoomId) => void;
};

export function ProfilePanel({
  displayName,
  activeRoomId,
  participants,
  liveRooms,
  onSelect,
}: ProfilePanelProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-5 p-4 xl:flex">
      <div className="glass flex flex-col items-center rounded-[1.5rem] px-4 py-6">
        <span className="halo-ring flex size-24 items-center justify-center rounded-full bg-linear-to-br from-copper via-violet to-led font-display text-2xl">
          {initials(displayName)}
        </span>
        <p className="mt-4 truncate font-display text-lg">{displayName}</p>
        <p className="text-xs text-mist">
          {activeRoomId ? getRoomLabel(activeRoomId) : "Explorando"}
        </p>
      </div>
      {activeRoomId ? (
        <div>
          <h2 className="mb-2 px-1 text-xs tracking-wide text-mist uppercase">Na sala</h2>
          <ParticipantList participants={participants} />
        </div>
      ) : (
        <div>
          <h2 className="mb-2 px-1 text-xs tracking-wide text-mist uppercase">Atividade recente</h2>
          {liveRooms.length === 0 ? (
            <p className="glass-soft rounded-2xl px-3 py-4 text-sm text-mist">
              Ninguém nas salas ainda. Seja a primeira pessoa.
            </p>
          ) : (
            <ul className="space-y-2">
              {liveRooms.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="glass-soft flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm hover:bg-white/10"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-mist">{item.occupantCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}
