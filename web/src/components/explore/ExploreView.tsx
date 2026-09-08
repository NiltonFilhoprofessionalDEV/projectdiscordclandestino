import { useRef } from "react";
import { ArrowUpRight, Radio, Search, Users } from "lucide-react";
import type { RoomId } from "../../../../shared/rooms.ts";
import type { RoomOccupancy } from "../../services/api.ts";
import { Input } from "../ui/input.tsx";
import { cn } from "../../lib/utils.ts";
import { PulseLine } from "../shell/PulseLine.tsx";

const ROOM_PRESENTATION: Record<
  RoomId,
  { eyebrow: string; description: string; accent: string }
> = {
  geral: {
    eyebrow: "Conversa aberta",
    description: "Assuntos do dia e encontros espontâneos.",
    accent: "from-electric to-[#49b8ff]",
  },
  jogos: {
    eyebrow: "Squad online",
    description: "Monte o time e entre na partida.",
    accent: "from-pulse to-[#c05cff]",
  },
  reuniao: {
    eyebrow: "Ponto de encontro",
    description: "Alinhe ideias com áudio claro e direto.",
    accent: "from-[#ff8a66] to-coral",
  },
  desenvolvimento: {
    eyebrow: "Build em conjunto",
    description: "Código, produto e decisões técnicas.",
    accent: "from-[#39c6b4] to-electric",
  },
};

type ExploreViewProps = {
  rooms: RoomOccupancy[];
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: RoomId) => void;
  occupancyError: string | null;
};

function occupancyLabel(count: number): string {
  return count === 1 ? "1 pessoa agora" : `${count} pessoas agora`;
}

type RoomCardProps = {
  room: RoomOccupancy;
  onSelect: (id: RoomId) => void;
};

function RoomCard({ room, onSelect }: RoomCardProps) {
  const presentation = ROOM_PRESENTATION[room.id];
  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      aria-label={`Entrar na sala ${room.label}, ${occupancyLabel(room.occupantCount)}`}
      className="focus-ring surface-raised group flex min-h-40 overflow-hidden rounded-[1.35rem] text-left transition hover:-translate-y-0.5 hover:border-electric/30"
    >
      <span
        className={cn(
          "w-2 shrink-0 bg-linear-to-b transition group-hover:w-3",
          presentation.accent,
        )}
        aria-hidden
      />
      <span className="flex flex-1 flex-col p-5">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-haze uppercase">
          {presentation.eyebrow}
        </span>
        <span className="mt-2 font-display text-xl text-cloud">{room.label}</span>
        <span className="mt-1 text-sm leading-relaxed text-haze">
          {presentation.description}
        </span>
        <span className="mt-auto flex items-end justify-between pt-5">
          <span className="flex items-center gap-1.5 text-xs text-haze">
            <Users className="size-3.5" />
            {occupancyLabel(room.occupantCount)}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-[#aab9ff]">
            Entrar <ArrowUpRight className="size-4" />
          </span>
        </span>
      </span>
    </button>
  );
}

export function ExploreView({
  rooms,
  query,
  onQuery,
  onSelect,
  occupancyError,
}: ExploreViewProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const matchingRooms = rooms.filter((room) =>
    room.label.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
  );
  const liveRooms = matchingRooms.filter((room) => room.occupantCount > 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <div className="flex justify-center lg:justify-end">
        <label className="relative w-full max-w-md" htmlFor="room-search">
          <span className="sr-only">Buscar salas</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-haze" />
          <Input
            ref={searchRef}
            id="room-search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Buscar uma sala"
            className="h-11 pl-11"
          />
        </label>
      </div>

      <section className="surface-raised relative grid overflow-hidden rounded-[1.6rem] p-6 sm:p-8 lg:min-h-56 lg:grid-cols-[1fr_0.7fr] lg:items-center">
        <div className="relative z-10">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#aab9ff] uppercase">
            <Radio className="size-4 text-coral" /> Salas abertas
          </p>
          <h2 className="mt-4 max-w-xl font-display text-2xl leading-tight text-cloud sm:text-3xl lg:text-4xl">
            Encontre sua próxima conversa.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-haze">
            Entre em uma sala, encontre sua turma e comece a falar. Sem cadastro,
            sem espera.
          </p>
          <p className="mt-5 text-xs font-semibold text-electric">
            {rooms.length} {rooms.length === 1 ? "sala disponível" : "salas disponíveis"}
          </p>
        </div>
        <div className="relative hidden h-24 lg:block" aria-hidden>
          <span className="absolute top-2 right-4 size-20 rounded-[1.4rem] bg-pulse/20 ring-1 ring-pulse/30" />
          <span className="absolute right-24 bottom-0 size-16 rounded-[1.2rem] bg-electric/20 ring-1 ring-electric/30" />
          <span className="absolute right-0 bottom-1 size-12 rounded-xl bg-coral/18 ring-1 ring-coral/25" />
          <PulseLine active className="absolute top-1/2 right-0 w-full" />
        </div>
      </section>

      {occupancyError ? <p className="text-sm text-coral">{occupancyError}</p> : null}

      {!normalizedQuery && liveRooms.length > 0 ? (
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-cloud">
            <span className="size-2 rounded-full bg-coral shadow-[0_0_12px_rgba(255,93,115,0.65)]" />
            Ao vivo agora
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {liveRooms.map((room) => (
              <RoomCard key={room.id} room={room} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="mb-4 text-sm font-semibold text-cloud">Todas as salas</h3>
        {matchingRooms.length === 0 ? (
          <div className="surface rounded-[1.35rem] px-5 py-10 text-center">
            <p className="font-semibold text-cloud">Nenhuma sala encontrada.</p>
            <p className="mt-1 text-sm text-haze">Limpe a busca ou tente outro nome.</p>
            <button
              type="button"
              onClick={() => {
                onQuery("");
                requestAnimationFrame(() => searchRef.current?.focus());
              }}
              className="focus-ring mt-5 min-h-11 rounded-xl px-4 text-sm font-semibold text-[#aab9ff] hover:bg-white/5"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matchingRooms.map((room) => (
              <RoomCard key={room.id} room={room} onSelect={onSelect} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
