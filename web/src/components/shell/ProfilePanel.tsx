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
    <aside className="surface hidden w-72 shrink-0 flex-col gap-6 border-y-0 border-r-0 p-5 xl:flex">
      <div className="flex flex-col items-center border-b border-haze/10 px-2 pb-6">
        <span className="flex size-20 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#9333ea_50%,#ec4899_100%)] font-display text-xl text-white shadow-[0_14px_28px_rgba(124,58,237,0.28)]">
          {initials(displayName)}
        </span>
        <p className="mt-4 max-w-full truncate font-display text-lg text-cloud">
          {displayName}
        </p>
        <p className="mt-1 text-xs text-haze">
          {activeRoomId ? getRoomLabel(activeRoomId) : "Explorando"}
        </p>
      </div>
      {activeRoomId ? (
        <div>
          <h2 className="mb-3 px-1 text-xs font-semibold tracking-[0.14em] text-haze uppercase">
            Na sala
          </h2>
          <ParticipantList participants={participants} />
        </div>
      ) : (
        <div>
          <h2 className="mb-3 px-1 text-xs font-semibold tracking-[0.14em] text-haze uppercase">
            Ao vivo agora
          </h2>
          {liveRooms.length === 0 ? (
            <p className="rounded-xl bg-abyss/55 px-3 py-4 text-sm leading-relaxed text-haze">
              Ninguém nas salas ainda. Seja a primeira pessoa.
            </p>
          ) : (
            <ul className="space-y-2">
              {liveRooms.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-label={`Entrar na sala ${item.label}`}
                    className="focus-ring flex min-h-11 w-full items-center justify-between rounded-xl bg-abyss/55 px-3 text-left text-sm text-cloud transition duration-150 ease-out hover:bg-abyss"
                  >
                    <span>{item.label}</span>
                    <span className="control-badge bg-electric/15 text-electric">
                      {item.occupantCount}
                    </span>
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
