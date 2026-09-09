import type { ChannelId } from "../../../shared/community.ts";
import type { CenterSurface } from "./selection.ts";

export type ShellNav = {
  surface: CenterSurface;
  activeVoiceChannelId: ChannelId | null;
  activeTextChannelId: ChannelId | null;
  sidebarOpen: boolean;
};

export const initialShellNav: ShellNav = {
  surface: "explore",
  activeVoiceChannelId: null,
  activeTextChannelId: null,
  sidebarOpen: false,
};

export function applySelectText(nav: ShellNav, id: ChannelId): ShellNav {
  return { ...nav, activeTextChannelId: id, surface: "text", sidebarOpen: false };
}

export function applySelectVoice(nav: ShellNav, id: ChannelId): ShellNav {
  return { ...nav, activeVoiceChannelId: id, surface: "voice", sidebarOpen: false };
}

export function applyLeaveVoice(nav: ShellNav): ShellNav {
  return {
    ...nav,
    activeVoiceChannelId: null,
    surface: nav.surface === "voice" ? "text" : nav.surface,
  };
}

export function applyExplore(nav: ShellNav): ShellNav {
  return { ...nav, surface: "explore", sidebarOpen: false };
}

export function applyOpenMember(nav: ShellNav): ShellNav {
  return { ...nav, surface: "text", sidebarOpen: false };
}

export function applyPreviewCommunity(nav: ShellNav): ShellNav {
  return { ...nav, surface: "preview", sidebarOpen: false };
}
