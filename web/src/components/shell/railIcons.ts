import { Code2, Gamepad2, Home as HomeIcon, Users } from "lucide-react";
import type { RoomId } from "../../../../shared/rooms.ts";

export const RAIL_ICONS: Record<RoomId, typeof HomeIcon> = {
  geral: HomeIcon,
  jogos: Gamepad2,
  reuniao: Users,
  desenvolvimento: Code2,
};
