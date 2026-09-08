import { useEffect, useState } from "react";
import type { RoomOccupancy } from "../services/api.ts";
import { fetchRooms } from "../services/api.ts";

export function useOccupancy(): {
  rooms: RoomOccupancy[];
  error: string | null;
} {
  const [rooms, setRooms] = useState<RoomOccupancy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchRooms();
        if (!cancelled) {
          setRooms(next);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar salas.");
        }
      }
    }

    void load();
    const id = window.setInterval(() => void load(), 5000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return { rooms, error };
}
