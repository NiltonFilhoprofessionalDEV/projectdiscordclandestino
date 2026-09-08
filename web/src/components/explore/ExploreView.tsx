import { Search, Users } from "lucide-react";
import type { RoomId } from "../../../../shared/rooms.ts";
import type { RoomOccupancy } from "../../services/api.ts";
import { Input } from "../ui/input.tsx";
import { cn } from "../../lib/utils.ts";

const ROOM_ART: Record<RoomId, string> = {
  geral: "from-[#ff4ec8] via-[#9b5cff] to-[#2a1450]",
  jogos: "from-[#7ee0ff] via-[#7b3dff] to-[#160f29]",
  reuniao: "from-[#ff7ad8] via-[#6a3cff] to-[#1a0c30]",
  desenvolvimento: "from-[#c77dff] via-[#4a2a8a] to-[#0b0616]",
};

type ExploreViewProps = {
  rooms: RoomOccupancy[];
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: RoomId) => void;
  occupancyError: string | null;
};

export function ExploreView({
  rooms,
  query,
  onQuery,
  onSelect,
  occupancyError,
}: ExploreViewProps) {
  const filtered = rooms.filter((room) =>
    room.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex justify-center">
        <label className="relative w-full max-w-xl" htmlFor="room-search">
          <span className="sr-only">Buscar salas</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist" />
          <Input
            id="room-search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Buscar salas"
            className="h-12 rounded-full border-white/12 bg-white/5 pl-11"
          />
        </label>
      </div>

      <section className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-[#ff4ec8] via-[#9b5cff] to-[#3a1468] px-8 py-14 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_42%)]" />
        <div className="relative">
          <p className="text-sm tracking-[0.28em] text-white/80 uppercase">Explore</p>
          <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">As salas já existem</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/80">
            Escolha uma comunidade e entre na hora. Sem conta, sem fila.
          </p>
        </div>
      </section>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-fog">Comunidades em destaque</h3>
        {occupancyError ? <p className="mb-3 text-xs text-rose-300">{occupancyError}</p> : null}
        {filtered.length === 0 ? (
          <p className="glass-soft rounded-2xl px-4 py-8 text-center text-sm text-mist">
            Nenhuma sala com esse nome. Tente outro termo.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelect(room.id)}
                className="group relative min-h-44 overflow-hidden rounded-[1.5rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-copper/70"
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-linear-to-br opacity-95 transition duration-300 group-hover:scale-105",
                    ROOM_ART[room.id],
                  )}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.22),transparent_40%)]" />
                <div className="absolute inset-x-0 bottom-0 glass p-4">
                  <p className="font-display text-lg text-fog">{room.label}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-mist">
                    <Users className="size-3.5" />
                    {room.occupantCount === 1
                      ? "1 pessoa agora"
                      : `${room.occupantCount} pessoas agora`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
